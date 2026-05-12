/**
 * Intención: Expone los endpoints de la API relacionados al recurso [ruta].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `ruta.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const express = require('express');
const router = express.Router();

const rutaController = require('../controllers/ruta.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/Usuario');

/**
 * Crear ruta
 */
router.post('/', requireAuth, requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), rutaController.crearRuta);

/**
 * Obtener todas las rutas
 */
router.get('/', requireAuth, rutaController.obtenerRutas);

/**
 * Obtener una ruta por ID
 */
router.get('/:id', requireAuth, rutaController.obtenerRutaPorId);

/**
 * Actualizar ruta
 */
router.put('/:id', requireAuth, requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), rutaController.actualizarRuta);

/**
 * Eliminar ruta
 */
router.delete('/:id', requireAuth, requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), rutaController.eliminarRuta);

module.exports = router;