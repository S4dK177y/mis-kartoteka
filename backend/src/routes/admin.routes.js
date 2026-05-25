const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.get('/users', authenticateToken, requireAdmin, adminController.getUsers);
router.post('/users', authenticateToken, requireAdmin, adminController.createUser);
router.put('/users/:id/role', authenticateToken, requireAdmin, adminController.updateUserRole);

router.get('/logs', authenticateToken, requireAdmin, adminController.getLogs);
router.get('/logs/stats', authenticateToken, requireAdmin, adminController.getLogStats);

router.get('/settings', authenticateToken, requireAdmin, adminController.getSettings);
router.put('/settings', authenticateToken, requireAdmin, adminController.updateSettings);
router.post('/migrate-encryption', authenticateToken, requireAdmin, adminController.migrateEncryption);

module.exports = router;
