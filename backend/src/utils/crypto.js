const fs = require('fs');
const path = require('path');
const cng = require('./cng');

let encryptMGM, decryptMGM;
let streebog256hmac, streebog512pbkdf2;

async function initGost() {
  if (!encryptMGM) {
    const kuznyechik = await import('@li0ard/kuznyechik');
    encryptMGM = kuznyechik.encryptMGM;
    decryptMGM = kuznyechik.decryptMGM;
  }
  if (!streebog256hmac) {
    const streebog = await import('@li0ard/streebog');
    // Use the built-in HMAC and PBKDF2 from the library (backed by @noble/hashes — correct impl)
    streebog256hmac = streebog.Streebog256HMAC;
    streebog512pbkdf2 = streebog.Streebog512PBKDF2;
  }
}

const ENCRYPTION_CONFIG_PATH = path.join(__dirname, '..', '..', '..', 'data', 'encryption.json');

// In-memory master key (never saved to disk)
let masterKey = null;

// KDF settings
const KDF_ITERATIONS = 1000; // Pure-JS Streebog-512 is ~200x slower than SHA-256; 1000 iter ≈ 2s
const KEY_LENGTH = 32; // 256 bits

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
 * Derives a 32-byte key from a password and salt using PBKDF2-Streebog512.
 * Uses the library's built-in implementation backed by @noble/hashes (correct and deterministic).
 * GOST R 34.11-2012 compliant KDF.
 */
function deriveKey(password, salt) {
  const passwordBuf = Buffer.isBuffer(password) ? password : Buffer.from(password, 'utf8');
  const saltBuf = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'hex');
  // Returns Uint8Array — take first 32 bytes for 256-bit key
  const derived = streebog512pbkdf2(passwordBuf, saltBuf, KDF_ITERATIONS, 64);
  return Buffer.from(derived).subarray(0, KEY_LENGTH);
}

/**
 * Computes HMAC-Streebog256 for a verification hash.
 * Uses the library's built-in HMAC backed by @noble/hashes.
 */
function computeVerificationHash(key) {
  // HMAC-Streebog256(key, key) — used only to verify the password
  const hmac = streebog256hmac(key);
  hmac.update(key);
  return Buffer.from(hmac.digest()).toString('hex');
}

/**
 * Computes a deterministic IV for searchable encryption using HMAC-Streebog256.
 * @noble/hashes-based — correct and deterministic.
 */
function deterministicIV(plaintext) {
  const hmac = streebog256hmac(masterKey);
  hmac.update(plaintext);
  return Buffer.from(hmac.digest()).subarray(0, 16);
}

// --- Envelope Encryption ---

/**
 * Sets up encryption for the first time.
 */
async function setupEncryption(password) {
  if (isInitialized()) throw new Error('Encryption is already initialized.');

  const salt = cng.randomBytes(16).toString('hex');
  const kek = deriveKey(password, salt);
  const vHash = computeVerificationHash(kek);

  const config = {
    initialized: true,
    salt,
    verificationHash: vHash,
    kdfAlgorithm: 'pbkdf2-streebog512',
    encryptionAlgorithm: 'gost-kuznyechik-mgm'
  };

  fs.writeFileSync(ENCRYPTION_CONFIG_PATH, JSON.stringify(config, null, 2));
  masterKey = kek;
}

/**
 * Unlocks the system using the master password.
 */
async function unlock(password) {
  if (!isInitialized()) throw new Error('Encryption not initialized.');

  const config = JSON.parse(fs.readFileSync(ENCRYPTION_CONFIG_PATH, 'utf8'));
  const kek = deriveKey(password, config.salt);
  const vHash = computeVerificationHash(kek);

  if (vHash !== config.verificationHash) {
    throw new Error('Invalid master password.');
  }

  if (config.encryptedDek) {
    // Envelope encryption: decrypt the DEK using KEK
    const parts = config.encryptedDek.split(':');
    if (parts.length === 2) {
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = Buffer.from(parts[1], 'hex');
      const decrypted = decryptMGM(kek, encrypted, iv, Buffer.alloc(0));
      masterKey = Buffer.from(decrypted);
    } else {
      throw new Error('Corrupted encrypted DEK.');
    }
  } else {
    // No envelope: KEK is the DEK
    masterKey = kek;
  }
}

/**
 * Changes the master password using Envelope Encryption.
 * The current DEK is re-wrapped with the new KEK.
 */
async function changePassword(oldPassword, newPassword) {
  if (!isInitialized()) throw new Error('Encryption not initialized.');
  if (!masterKey) throw new Error('System must be unlocked to change password.');

  const config = JSON.parse(fs.readFileSync(ENCRYPTION_CONFIG_PATH, 'utf8'));

  // Verify old password
  const oldKek = deriveKey(oldPassword, config.salt);
  const oldVHash = computeVerificationHash(oldKek);
  if (oldVHash !== config.verificationHash) {
    throw new Error('Invalid old password.');
  }

  // Generate new KEK from new password
  const newSalt = cng.randomBytes(16).toString('hex');
  const newKek = deriveKey(newPassword, newSalt);
  const newVHash = computeVerificationHash(newKek);

  // Wrap current DEK with new KEK using Kuznyechik MGM
  const iv = cng.randomBytes(16);
  const encrypted = encryptMGM(newKek, masterKey, iv, Buffer.alloc(0));
  const encryptedDek = `${iv.toString('hex')}:${Buffer.from(encrypted).toString('hex')}`;

  const newConfig = {
    initialized: true,
    salt: newSalt,
    verificationHash: newVHash,
    encryptedDek,
    kdfAlgorithm: 'pbkdf2-streebog512',
    encryptionAlgorithm: 'gost-kuznyechik-mgm'
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
 * Encrypts text using GOST Kuznyechik MGM with a random IV.
 */
function encryptText(text) {
  if (!text) return text;
  if (!masterKey) throw new Error('System is locked.');

  const iv = cng.randomBytes(16);
  const plaintext = Buffer.from(text, 'utf8');

  const encrypted = encryptMGM(masterKey, plaintext, iv, Buffer.alloc(0));
  return `gost:${iv.toString('hex')}:${Buffer.from(encrypted).toString('hex')}`;
}

/**
 * Encrypts text deterministically (same input = same output) for indexed search.
 * IV is derived via HMAC-Streebog256(masterKey, plaintext), then encrypted with Kuznyechik.
 */
function encryptDeterministic(text) {
  if (!text) return text;
  if (!masterKey) throw new Error('System is locked.');

  const plaintext = Buffer.from(text, 'utf8');
  const iv = deterministicIV(plaintext);

  const encrypted = encryptMGM(masterKey, plaintext, iv, Buffer.alloc(0));
  return `detgost:${iv.toString('hex')}:${Buffer.from(encrypted).toString('hex')}`;
}

/**
 * Decrypts text. Handles gost: and detgost: prefixes.
 * Returns the original string unchanged if not encrypted.
 */
function decryptText(encryptedStr) {
  if (!encryptedStr || typeof encryptedStr !== 'string') return encryptedStr;

  let parts = encryptedStr.split(':');
  let isGost = false;

  if (parts[0] === 'gost' || parts[0] === 'detgost') {
    isGost = true;
    parts = parts.slice(1);
  }

  if (!isGost || parts.length !== 2) {
    return encryptedStr; // Plain text or legacy format
  }

  if (!masterKey) return encryptedStr;

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const decrypted = decryptMGM(masterKey, encrypted, iv, Buffer.alloc(0));
    return Buffer.from(decrypted).toString('utf8');
  } catch (err) {
    console.error('Decryption error, returning raw string. Error:', err.message);
    return encryptedStr;
  }
}

/**
 * Encrypts a raw Buffer using GOST Kuznyechik MGM.
 * Output format: [16 bytes IV] + [ciphertext + auth tag]
 */
function encryptBuffer(buffer) {
  if (!buffer) return buffer;
  if (!masterKey) throw new Error('System is locked.');

  const iv = cng.randomBytes(16);
  const encrypted = encryptMGM(masterKey, buffer, iv, Buffer.alloc(0));

  return Buffer.concat([iv, Buffer.from(encrypted)]);
}

/**
 * Decrypts a raw Buffer.
 * Expects: [16 bytes IV] + [ciphertext + auth tag]
 */
function decryptBuffer(buffer) {
  if (!buffer || buffer.length < 32) return buffer;
  if (!masterKey) return buffer;

  try {
    const iv = buffer.subarray(0, 16);
    const encrypted = buffer.subarray(16);
    const decrypted = decryptMGM(masterKey, encrypted, iv, Buffer.alloc(0));
    return Buffer.from(decrypted);
  } catch (err) {
    console.error('Buffer decryption error:', err.message);
    return buffer;
  }
}

/**
 * Gets the raw master key.
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
  encryptBuffer,
  decryptBuffer,
  getMasterKey,
  changePassword,
  initGost
};
