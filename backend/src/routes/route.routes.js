const express = require('express');
const router = express.Router();

const routeController = require('../controllers/route.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { ROLES_USUARIO } = require('../models/User');

router.post('/', authMiddleware, authorizeRoles(ROLES_USUARIO.SUPERUSUARIO, ROLES_USUARIO.ADMINISTRADOR), routeController.createRoute);

router.get('/', authMiddleware, routeController.getRoutes);

router.get('/:id', authMiddleware, routeController.getRouteById);

router.put('/:id', authMiddleware, authorizeRoles(ROLES_USUARIO.SUPERUSUARIO, ROLES_USUARIO.ADMINISTRADOR), routeController.updateRoute);

router.delete('/:id', authMiddleware, authorizeRoles(ROLES_USUARIO.SUPERUSUARIO, ROLES_USUARIO.ADMINISTRADOR), routeController.deleteRoute);

module.exports = router;