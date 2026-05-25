const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENCRYPTION_CONFIG_PATH = path.join(__dirname, '..', '..', '..', 'data', 'encryption.json');

// In-memory master key (never saved to disk)
let masterKey = null;

// Settings
const ALGORITHM = 'aes-256-gcm';
const ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits
const DIGEST = 'sha256';

/**
 * Checks if encryption is setup.
 */
function isInitialized() {
  return fs.existsSync(ENCRYPTION_CONFIG_PATH);
}

/**
 * Checks if the system is unlocked (key in RAM).
 */
function isUnlocked() {
  return masterKey !== null;
}

/**
 * Sets up encryption for the first time.
 */
async function setupEncryption(password) {
  if (isInitialized()) throw new Error('Encryption is already initialized.');
  
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  
  // Create a verification hash so we can verify the password later without storing it
  const verificationHash = crypto.createHash('sha256').update(key).digest('hex');
  
  const config = {
    initialized: true,
    salt,
    verificationHash
  };
  
  fs.writeFileSync(ENCRYPTION_CONFIG_PATH, JSON.stringify(config, null, 2));
  masterKey = key;
}

/**
 * Unlocks the system using the master password.
 */
async function unlock(password) {
  if (!isInitialized()) throw new Error('Encryption not initialized.');
  
  const config = JSON.parse(fs.readFileSync(ENCRYPTION_CONFIG_PATH, 'utf8'));
  const kek = crypto.pbkdf2Sync(password, config.salt, ITERATIONS, KEY_LENGTH, DIGEST);
  const verificationHash = crypto.createHash('sha256').update(kek).digest('hex');
  
  if (verificationHash !== config.verificationHash) {
    throw new Error('Invalid master password.');
  }
  
  if (config.encryptedDek) {
    // Envelope encryption: decrypt the DEK using KEK
    let parts = config.encryptedDek.split(':');
    if (parts.length === 3) {
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv(ALGORITHM, kek, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex');
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      masterKey = decrypted; // The actual DEK
    } else {
      throw new Error('Corrupted encrypted DEK.');
    }
  } else {
    // Legacy mode: the KEK is the DEK
    masterKey = kek;
  }
}

/**
 * Changes the master password using Envelope Encryption.
 */
async function changePassword(oldPassword, newPassword) {
  if (!isInitialized()) throw new Error('Encryption not initialized.');
  if (!masterKey) throw new Error('System must be unlocked to change password.');
  
  const config = JSON.parse(fs.readFileSync(ENCRYPTION_CONFIG_PATH, 'utf8'));
  
  // Verify old password
  const oldKek = crypto.pbkdf2Sync(oldPassword, config.salt, ITERATIONS, KEY_LENGTH, DIGEST);
  const oldVerificationHash = crypto.createHash('sha256').update(oldKek).digest('hex');
  if (oldVerificationHash !== config.verificationHash) {
    throw new Error('Invalid old password.');
  }
  
  // Generate new KEK
  const newSalt = crypto.randomBytes(16).toString('hex');
  const newKek = crypto.pbkdf2Sync(newPassword, newSalt, ITERATIONS, KEY_LENGTH, DIGEST);
  const newVerificationHash = crypto.createHash('sha256').update(newKek).digest('hex');
  
  // Encrypt the current DEK (masterKey) using the new KEK
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, newKek, iv);
  
  let encrypted = cipher.update(masterKey, null, 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  const encryptedDek = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  
  const newConfig = {
    initialized: true,
    salt: newSalt,
    verificationHash: newVerificationHash,
    encryptedDek
  };
  
  fs.writeFileSync(ENCRYPTION_CONFIG_PATH, JSON.stringify(newConfig, null, 2));
}


/**
 * Locks the system (clears key from memory).
 */
function lock() {
  masterKey = null;
}

/**
 * Encrypts text using AES-256-GCM.
 */
function encryptText(text) {
  if (!text) return text;
  if (!masterKey) throw new Error('System is locked.');
  
  // Format: iv:authTag:ciphertext
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Encrypts text deterministically (same input = same output) so it can be searched.
 * Uses HMAC-SHA256 of the plaintext to generate a stable IV.
 */
function encryptDeterministic(text) {
  if (!text) return text;
  if (!masterKey) throw new Error('System is locked.');
  
  // Generate deterministic 12-byte IV using HMAC of the plaintext itself
  const iv = crypto.createHmac('sha256', masterKey).update(text).digest().subarray(0, 12);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `det:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts text using AES-256-GCM.
 */
function decryptText(encryptedStr) {
  if (!encryptedStr) return encryptedStr;
  
  // Attempt to detect if string is actually encrypted. 
  // Format is exactly: hex(12 bytes):hex(16 bytes):hex(ciphertext) -> 24 chars : 32 chars : ...
  // OR det:hex(12 bytes):hex(16 bytes):hex(ciphertext)
  let parts = encryptedStr.split(':');
  let isDet = false;
  
  if (parts[0] === 'det') {
    isDet = true;
    parts = parts.slice(1);
  }
  
  if (parts.length !== 3 || parts[0].length !== 24 || parts[1].length !== 32) {
    return encryptedStr; // Assume it's plain text (not yet migrated or not an encrypted field)
  }
  
  if (!masterKey) return encryptedStr; // If locked, just return the encrypted string so it doesn't crash internals
  
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error, returning raw string. Error:', err.message);
    return encryptedStr; // Fallback for safety during transitions
  }
}

/**
 * Gets the raw master key for file stream encryption
 */
function getMasterKey() {
  if (!masterKey) throw new Error('System is locked.');
  return masterKey;
}

module.exports = {
  isInitialized,
  isUnlocked,
  setupEncryption,
  unlock,
  lock,
  encryptText,
  encryptDeterministic,
  decryptText,
  getMasterKey,
  changePassword
};
