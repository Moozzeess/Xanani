const express = require('express');
const router = express.Router();

const rutaController = require('../controllers/ruta.controller');

/**
 * Crear ruta
 */
router.post('/', rutaController.crearRuta);

/**
 * Obtener todas las rutas
 */
router.get('/', rutaController.obtenerRutas);

/**
 * Obtener una ruta por ID
 */
router.get('/:id', rutaController.obtenerRutaPorId);

/**
 * Actualizar ruta
 */
router.put('/:id', rutaController.actualizarRuta);

/**
 * Eliminar ruta
 */
router.delete('/:id', rutaController.eliminarRuta);

module.exports = router;