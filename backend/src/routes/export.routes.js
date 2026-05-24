const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticateToken } = require('../middlewares/auth');

router.get('/export/patients', authenticateToken, exportController.exportPatients);

module.exports = router;
