const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

const multer = require('multer');
const path = require('path');
const os = require('os');
const backupController = require('../controllers/backup.controller');

const tmpUpload = multer({ dest: os.tmpdir() });

router.get('/users', authenticateToken, requireAdmin, adminController.getUsers);
router.post('/users', authenticateToken, requireAdmin, adminController.createUser);
router.put('/users/:id/role', authenticateToken, requireAdmin, adminController.updateUserRole);

router.get('/logs', authenticateToken, requireAdmin, adminController.getLogs);
router.get('/logs/stats', authenticateToken, requireAdmin, adminController.getLogStats);

router.get('/settings', authenticateToken, requireAdmin, adminController.getSettings);
router.put('/settings', authenticateToken, requireAdmin, adminController.updateSettings);
router.post('/migrate-encryption', authenticateToken, requireAdmin, adminController.migrateEncryption);

// Backup Routes
router.get('/backups/settings', authenticateToken, requireAdmin, backupController.getSettings);
router.put('/backups/settings', authenticateToken, requireAdmin, backupController.updateSettings);
router.get('/backups', authenticateToken, requireAdmin, backupController.listBackups);
router.post('/backups/create', authenticateToken, requireAdmin, backupController.createBackup);
router.get('/backups/download/:filename', authenticateToken, requireAdmin, backupController.downloadBackup);
router.delete('/backups/:filename', authenticateToken, requireAdmin, backupController.deleteBackup);
router.post('/backups/restore', authenticateToken, requireAdmin, backupController.restoreFromServer);
router.post('/backups/upload-and-restore', authenticateToken, requireAdmin, tmpUpload.single('file'), backupController.uploadAndRestore);

module.exports = router;
