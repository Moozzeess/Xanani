const router = require('express').Router();
const driverController = require('../controllers/driver.controller');

// Middleware de autenticación
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware de autorizacion
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { USER_ROLES } = require('../models/User');

router.post(
  '/', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR), 
  driverController.createDriver
);

module.exports = router;