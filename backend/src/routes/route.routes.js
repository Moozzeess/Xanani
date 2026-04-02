const express = require('express');
const router = express.Router();

const routeController = require('../controllers/route.controller');

router.post('/', routeController.createRoute);

router.get('/', routeController.getRoutes);

router.get('/:id', routeController.getRouteById);

router.put('/:id', routeController.updateRoute);

router.delete('/:id', routeController.deleteRoute);

module.exports = router;