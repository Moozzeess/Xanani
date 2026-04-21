const router = require('express').Router();
const notificacionController = require('../controllers/notificacion.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Todas las rutas de notificaciones requieren autenticación
router.use(requireAuth);

/**
 * GET /api/notificaciones
 * Obtener notificaciones dirigidas al rol del usuario.
 */
router.get('/', notificacionController.obtenerMisNotificaciones);

/**
 * PATCH /api/notificaciones/:id/leer
 * Marcar una notificación como leída.
 */
router.patch('/:id/leida', notificacionController.marcarComoLeida);

module.exports = router;
