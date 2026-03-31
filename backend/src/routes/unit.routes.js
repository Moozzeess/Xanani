const express = require('express');
const router = express.Router();

const unitController = require('../controllers/unit.controller');

router.post('/', unitController.createUnit);
router.get('/', unitController.getUnits);

module.exports = router;