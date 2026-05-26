const koffi = require('koffi');
const os = require('os');

let BCryptGenRandom = null;
const BCRYPT_USE_SYSTEM_PREFERRED_RNG = 0x00000002;

// We only load this on Windows
if (os.platform() === 'win32') {
  try {
    const bcrypt = koffi.load('bcrypt.dll');
    BCryptGenRandom = bcrypt.func('__stdcall', 'BCryptGenRandom', 'long', ['void*', 'uint8_t*', 'uint32', 'uint32']);
  } catch (err) {
    console.error('Failed to load bcrypt.dll for CNG:', err);
  }
}

/**
 * Generates cryptographically secure random bytes using Windows CNG.
 * Falls back to Node.js crypto on non-Windows platforms or if CNG fails.
 * @param {number} length 
 * @returns {Buffer}
 */
function randomBytes(length) {
  if (BCryptGenRandom) {
    const buffer = Buffer.alloc(length);
    const status = BCryptGenRandom(null, buffer, length, BCRYPT_USE_SYSTEM_PREFERRED_RNG);
    if (status !== 0) {
      throw new Error(`BCryptGenRandom failed with status: 0x${status.toString(16)}`);
    }
    return buffer;
  } else {
    // Fallback for non-Windows (or if bcrypt.dll fails to load)
    return require('crypto').randomBytes(length);
  }
}

module.exports = {
  randomBytes
};
