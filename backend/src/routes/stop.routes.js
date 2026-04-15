const express = require('express');
const router = express.Router();

const stopController = require('../controllers/stop.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { ROLES_USUARIO } = require('../models/User');

router.post('/', authMiddleware, authorizeRoles(ROLES_USUARIO.SUPERUSUARIO, ROLES_USUARIO.ADMINISTRADOR), stopController.createStop);

router.get('/', authMiddleware, stopController.getStops);

router.get('/route/:routeId', authMiddleware, stopController.getStopsByRoute);

module.exports = router;