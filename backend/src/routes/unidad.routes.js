const express = require('express');
const router = express.Router();
const unidadController = require('../controllers/unidad.controller');

/** Crear una unidad nueva */
router.post('/', unidadController.crearUnidad);

/** Obtener todas las unidades */
router.get('/', unidadController.obtenerUnidades);

/**
 * Endpoint público para la Landing Page.
 * Devuelve la unidad activa más cercana a las coordenadas dadas.
 * Query: ?lat=19.43&lng=-99.13
 */
router.get('/cercana', unidadController.obtenerMasCercana);

/**
 * Endpoint público para obtener la ruta de demostración.
 * Devuelve la ruta con más historial de ubicaciones GPS.
 */
router.get('/ruta-demo', unidadController.obtenerRutaDemo);

module.exports = router;