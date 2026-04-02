const express = require('express');
const router = express.Router();

const unitController = require('../controllers/unit.controller');

router.post('/', unitController.createUnit);
router.get('/', unitController.getUnits);
router.get('/my-unit', unitController.getUnitByDriver);
router.put('/:id/hardware', unitController.assignHardware);
router.put('/:id', unitController.updateUnit);
router.delete('/:id', unitController.deleteUnit);

module.exports = router;