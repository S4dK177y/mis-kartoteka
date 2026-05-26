const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');
const { authenticateToken } = require('../middlewares/auth');

router.get('/status', systemController.getStatus);
router.post('/setup-encryption', systemController.setupEncryption);
router.post('/unlock', systemController.unlock);
router.post('/lock', systemController.lock);
router.post('/change-password', authenticateToken, systemController.changePassword);
router.post('/factory-reset', authenticateToken, systemController.factoryReset);

module.exports = router;
