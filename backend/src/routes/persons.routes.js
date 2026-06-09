const express = require('express');
const router = express.Router();
const personsController = require('../controllers/persons.controller');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken, requireAdmin);

router.get('/', personsController.getAll);
router.get('/:personId', personsController.getById);

module.exports = router;
