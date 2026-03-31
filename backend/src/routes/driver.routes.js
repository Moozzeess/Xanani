const router = require('express').Router();
const driverController = require('../controllers/driver.controller');

// Middleware de autenticación
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware de autorizacion
const authorizeRoles = require('../middlewares/roleAuth.middleware');

router.post(
    '/',
    authMiddleware,
    authorizeRoles('SUPERUSUARIO'),
    driverController.createDriver
);

module.exports = router;