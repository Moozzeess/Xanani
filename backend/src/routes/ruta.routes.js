/**
 * Intención: Expone los endpoints de la API relacionados al recurso [ruta].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `ruta.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
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