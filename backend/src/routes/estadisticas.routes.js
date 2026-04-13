const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticas.controller');

/**
 * Rutas para el manejo de estadísticas y afluencia.
 */

router.get('/afluencia/:rutaId', estadisticasController.obtenerAfluenciaPorRuta);
router.get('/resumen', estadisticasController.obtenerResumenGeneral);

module.exports = router;
