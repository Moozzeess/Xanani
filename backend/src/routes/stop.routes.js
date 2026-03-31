const express = require('express');
const router = express.Router();

const stopController = require('../controllers/stop.controller');

router.post('/', stopController.createStop);

router.get('/', stopController.getStops);

router.get('/route/:routeId', stopController.getStopsByRoute);

module.exports = router;