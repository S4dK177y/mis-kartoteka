const express = require('express');
const router = express.Router();
const patientsController = require('../controllers/patients.controller');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken, requireAdmin);

router.get('/', patientsController.getAll);
router.get('/:id', patientsController.getById);
router.post('/', patientsController.create);
router.put('/:id', patientsController.update);
router.delete('/:id', patientsController.remove);
router.post('/:id/transfer', patientsController.transfer);

module.exports = router;
