const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticas.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

/**
 * Rutas para el manejo de estadísticas y afluencia.
 */

router.get('/afluencia/:rutaId', estadisticasController.obtenerAfluenciaPorRuta);
router.get('/resumen', estadisticasController.obtenerResumenGeneral);
router.get('/admin/dashboard', estadisticasController.obtenerDashboardAdmin);
router.get('/suscripciones', requireAuth, estadisticasController.obtenerAfluenciaSuscripciones);

module.exports = router;
