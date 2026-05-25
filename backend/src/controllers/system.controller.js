const cryptoUtil = require('../utils/crypto');
const prisma = require('../utils/prisma');
const migrateData = require('../utils/migrator');

exports.getStatus = async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const needsSetup = userCount === 0;
    
    res.json({
      needsSetup,
      encryptionInitialized: cryptoUtil.isInitialized(),
      isUnlocked: cryptoUtil.isUnlocked()
    });
  } catch (err) {
    // If DB is totally empty/missing or locked somehow (though sqlite shouldn't fail on just counting if not encrypted at file level)
    res.json({ needsSetup: true, encryptionInitialized: false, isUnlocked: false });
  }
};

exports.setupEncryption = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });
    
    if (cryptoUtil.isInitialized()) {
      return res.status(400).json({ error: 'Encryption already initialized' });
    }
    
    await cryptoUtil.setupEncryption(password);
    
    // Run migration in background so we don't block the request if there are many files
    migrateData().catch(err => console.error('Migration error:', err));
    
    res.json({ success: true, message: 'Encryption initialized and unlocked.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unlock = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });
    
    await cryptoUtil.unlock(password);
    res.json({ success: true, message: 'System unlocked.' });
  } catch (err) {
    res.status(403).json({ error: 'Invalid master password' });
  }
};

exports.lock = async (req, res) => {
  cryptoUtil.lock();
  res.json({ success: true, message: 'System locked.' });
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Both old and new passwords are required' });
    
    await cryptoUtil.changePassword(oldPassword, newPassword);
    res.json({ success: true, message: 'Master password changed successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
