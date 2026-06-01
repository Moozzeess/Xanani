/**
 * Intención: Expone los endpoints de la API relacionados al recurso [autenticacion].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `autenticacion.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const router = require('express').Router();
const autenticacionController = require('../controllers/autenticacion.controller');
const { requireAuth } = require('../middlewares/auth');

router.post('/registro', autenticacionController.registrar);
router.post('/login', autenticacionController.iniciarSesion);

// Nuevas rutas de seguridad
router.get('/verify-email/:token', autenticacionController.verificarCorreo);
router.post('/resend-verification', autenticacionController.reenviarVerificacion);
router.post('/forgot-password', autenticacionController.solicitarRecuperacion);
router.post('/reset-password/:token', autenticacionController.restablecerContrasena);
router.put('/cambiar-contrasena', requireAuth, autenticacionController.cambiarContrasena);

module.exports = router;
