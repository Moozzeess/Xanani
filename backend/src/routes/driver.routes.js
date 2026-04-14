const router = require('express').Router();
const driverController = require('../controllers/driver.controller');

// Middleware de autenticación
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware de autorizacion
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { ROLES_USUARIO } = require('../models/Usuario');

router.post(
    '/',
    authMiddleware,
    authorizeRoles(ROLES_USUARIO.SUPERUSUARIO),
    driverController.createDriver
);

module.exports = router;