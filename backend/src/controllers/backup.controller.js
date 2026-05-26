const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const prisma = require('../utils/prisma');
const cryptoUtil = require('../utils/crypto');
const { logAction } = require('../utils/logger');
const cron = require('node-cron');

const dataDir = path.join(__dirname, '../../data');
const backupsDir = path.join(__dirname, '../../backups');

// Ensure backups dir exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Scheduled job reference
let scheduledJob = null;

// --- Helper Functions ---

const createBackupFile = async (reqUserId = 'SYSTEM') => {
  // Ensure DB is flushed to disk
  await prisma.$queryRaw`PRAGMA wal_checkpoint(TRUNCATE)`;
  
  const zip = new AdmZip();
  
  // Add database
  const dbPath = path.join(dataDir, 'database.sqlite');
  if (fs.existsSync(dbPath)) zip.addLocalFile(dbPath);
  
  // Add encryption config
  const encPath = path.join(dataDir, 'encryption.json');
  if (fs.existsSync(encPath)) zip.addLocalFile(encPath);
  
  // Add storage directory
  const storageDir = path.join(dataDir, 'storage');
  if (fs.existsSync(storageDir)) zip.addLocalFolder(storageDir, 'storage');

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `MIS_Backup_${dateStr}.zip`;
  const backupPath = path.join(backupsDir, filename);
  
  zip.writeZip(backupPath);
  
  if (reqUserId !== 'SYSTEM') {
    await logAction(reqUserId, 'CREATE', 'Backup', filename);
  }
  
  return { filename, path: backupPath, size: fs.statSync(backupPath).size, createdAt: new Date() };
};

const enforceMaxBackups = async (maxCount) => {
  if (!maxCount || maxCount <= 0) return;
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.zip'))
    .map(f => ({ name: f, path: path.join(backupsDir, f), stat: fs.statSync(path.join(backupsDir, f)) }))
    .sort((a, b) => b.stat.birthtimeMs - a.stat.birthtimeMs);
    
  if (files.length > maxCount) {
    const toDelete = files.slice(maxCount);
    for (const f of toDelete) {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    }
  }
};

const setupCronJob = async () => {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }
  
  try {
    const enabledSetting = await prisma.setting.findUnique({ where: { key: 'backup_enabled' }});
    const cronSetting = await prisma.setting.findUnique({ where: { key: 'backup_cron' }});
    const maxSetting = await prisma.setting.findUnique({ where: { key: 'backup_max_count' }});
    
    const isEnabled = enabledSetting ? enabledSetting.value === 'true' : false;
    const cronStr = cronSetting ? cronSetting.value : '0 2 * * *'; // default 2 AM
    const maxCount = maxSetting ? parseInt(maxSetting.value, 10) : 7;

    if (isEnabled && cron.validate(cronStr)) {
      scheduledJob = cron.schedule(cronStr, async () => {
        try {
          console.log('[BACKUP] Starting scheduled backup...');
          await createBackupFile();
          await enforceMaxBackups(maxCount);
          console.log('[BACKUP] Scheduled backup completed.');
        } catch (err) {
          console.error('[BACKUP] Scheduled backup failed:', err);
        }
      });
      console.log(`[BACKUP] Scheduled job active: ${cronStr}`);
    }
  } catch (err) {
    console.error('[BACKUP] Failed to setup cron job:', err.message);
  }
};

// --- Controllers ---

exports.initScheduledBackups = () => {
  setupCronJob();
};

exports.getSettings = async (req, res) => {
  try {
    const enabled = await prisma.setting.findUnique({ where: { key: 'backup_enabled' }});
    const cronStr = await prisma.setting.findUnique({ where: { key: 'backup_cron' }});
    const maxCount = await prisma.setting.findUnique({ where: { key: 'backup_max_count' }});
    
    res.json({
      enabled: enabled ? enabled.value === 'true' : false,
      cron: cronStr ? cronStr.value : '0 2 * * *',
      maxCount: maxCount ? parseInt(maxCount.value, 10) : 7
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { enabled, cron: cronStr, maxCount } = req.body;
    
    if (cronStr && !cron.validate(cronStr)) {
      return res.status(400).json({ error: 'Invalid cron expression' });
    }

    await prisma.setting.upsert({ where: { key: 'backup_enabled' }, update: { value: String(enabled) }, create: { key: 'backup_enabled', value: String(enabled) } });
    await prisma.setting.upsert({ where: { key: 'backup_cron' }, update: { value: String(cronStr) }, create: { key: 'backup_cron', value: String(cronStr) } });
    await prisma.setting.upsert({ where: { key: 'backup_max_count' }, update: { value: String(maxCount) }, create: { key: 'backup_max_count', value: String(maxCount) } });
    
    await setupCronJob();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.listBackups = async (req, res) => {
  try {
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.endsWith('.zip'))
      .map(f => {
        const stat = fs.statSync(path.join(backupsDir, f));
        return {
          filename: f,
          size: stat.size,
          createdAt: stat.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
      
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createBackup = async (req, res) => {
  try {
    const result = await createBackupFile(req.user.id);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create backup: ' + error.message });
  }
};

exports.downloadBackup = (req, res) => {
  const filename = req.params.filename;
  const backupPath = path.join(backupsDir, filename);
  if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup not found' });
  
  res.download(backupPath, filename);
};

exports.deleteBackup = async (req, res) => {
  try {
    const filename = req.params.filename;
    const backupPath = path.join(backupsDir, filename);
    if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup not found' });
    
    fs.unlinkSync(backupPath);
    await logAction(req.user.id, 'DELETE', 'Backup', filename);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const performRestore = async (zipPath) => {
  // Validate zip
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  const hasDb = zipEntries.some(e => e.entryName === 'database.sqlite');
  const hasEnc = zipEntries.some(e => e.entryName === 'encryption.json');
  
  if (!hasDb || !hasEnc) {
    throw new Error('Invalid backup archive. Missing database or encryption config.');
  }

  // Disconnect prisma and wait for file locks to be fully released by OS
  await prisma.$disconnect();
  await delay(1000);

  // Fail-safe: instead of renaming the whole data folder (which throws EPERM on Windows if watched),
  // we move its contents to data.bak
  const bakDir = path.join(__dirname, '../../data.bak');
  if (fs.existsSync(bakDir)) fs.rmSync(bakDir, { recursive: true, force: true });
  fs.mkdirSync(bakDir, { recursive: true });

  const itemsMoved = [];
  try {
    if (fs.existsSync(dataDir)) {
      const items = fs.readdirSync(dataDir);
      for (const item of items) {
        const oldPath = path.join(dataDir, item);
        const newPath = path.join(bakDir, item);
        fs.renameSync(oldPath, newPath);
        itemsMoved.push({ oldPath, newPath });
      }
    }

    // Ensure data dir exists and extract
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    zip.extractAllTo(dataDir, true);
    
    // Cleanup bak
    if (fs.existsSync(bakDir)) fs.rmSync(bakDir, { recursive: true, force: true });
    
    // Lock crypto so user must re-enter master password for the restored state
    cryptoUtil.lock();
    
    return true;
  } catch (err) {
    // Rollback
    if (fs.existsSync(dataDir)) {
      const currentItems = fs.readdirSync(dataDir);
      for (const item of currentItems) {
        fs.rmSync(path.join(dataDir, item), { recursive: true, force: true });
      }
    }
    
    for (const move of itemsMoved) {
      if (fs.existsSync(move.newPath)) {
        fs.renameSync(move.newPath, move.oldPath);
      }
    }
    
    throw new Error('Restore failed, rolled back to previous state. Details: ' + err.message);
  }
};

exports.restoreFromServer = async (req, res) => {
  try {
    const filename = req.body.filename;
    if (!filename) return res.status(400).json({ error: 'Filename required' });
    
    const backupPath = path.join(backupsDir, filename);
    if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup not found' });
    
    await performRestore(backupPath);
    res.json({ success: true, message: 'Restore successful. System locked.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadAndRestore = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No backup file provided' });
    
    // File is uploaded to a tmp path by multer
    await performRestore(file.path);
    
    // Cleanup tmp file
    fs.unlinkSync(file.path);
    
    res.json({ success: true, message: 'Restore successful. System locked.' });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
};
