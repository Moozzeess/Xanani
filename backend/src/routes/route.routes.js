const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { USER_ROLES } = require('../models/User');

// Rutas protegidas
router.post(
  '/', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR), 
  routeController.createRoute
);

router.get('/', authMiddleware, routeController.getRoutes);

router.get('/:id', authMiddleware, routeController.getRouteById);

router.put(
  '/:id', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR), 
  routeController.updateRoute
);

router.delete(
  '/:id', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR), 
  routeController.deleteRoute
);

module.exports = router;