const express = require('express');
const router = express.Router();
const patientsController = require('../controllers/patients.controller');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, patientsController.getAll);
router.get('/:id', authenticateToken, patientsController.getById);
router.post('/', authenticateToken, patientsController.create);
router.put('/:id', authenticateToken, patientsController.update);
router.delete('/:id', authenticateToken, patientsController.remove);
router.post('/:id/transfer', authenticateToken, patientsController.transfer);

module.exports = router;
