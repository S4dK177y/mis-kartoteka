const express = require('express');
const router = express.Router();
const consultationsController = require('../controllers/consultations.controller');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

router.get('/', consultationsController.getAll);
router.post('/', consultationsController.create);
router.put('/:id', consultationsController.update);
router.delete('/:id', consultationsController.remove);

module.exports = router;
