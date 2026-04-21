const router = require('express').Router();
const reporteController = require('../controllers/reporte.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

/** Crear un nuevo reporte (pasajero autenticado) */
router.post('/', requireAuth, reporteController.crearReporte);

/** Obtener todos los reportes (administrativo) */
router.get('/', requireAuth, reporteController.obtenerReportes);

/** Obtener reportes propios del usuario autenticado */
router.get('/usuario', requireAuth, reporteController.misReportes);

/** Actualizar estado de un reporte (administrativo) */
router.patch('/:id', requireAuth, reporteController.actualizarEstadoReporte);

/** Eliminar un reporte (administrativo) */
router.delete('/:id', requireAuth, reporteController.eliminarReporte);

module.exports = router;
