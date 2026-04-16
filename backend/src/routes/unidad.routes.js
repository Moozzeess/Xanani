const express = require('express');
const router = express.Router();
const unidadController = require('../controllers/unidad.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/Usuario');

/**
 * Endpoints Administrativos (Protegidos)
 */
router.get(
  '/', 
  requireAuth, 
  requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), 
  unidadController.obtenerUnidades
);

router.post(
  '/', 
  requireAuth, 
  requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), 
  unidadController.crearUnidad
);

router.put(
  '/:id', 
  requireAuth, 
  requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), 
  unidadController.actualizarUnidad
);

router.delete(
  '/:id', 
  requireAuth, 
  requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), 
  unidadController.eliminarUnidad
);

router.put(
  '/:id/hardware', 
  requireAuth, 
  requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), 
  unidadController.asignarHardware
);

/**
 * Endpoints de Conductor (Privado)
 */
router.get(
  '/privado/mi-unidad', 
  requireAuth, 
  unidadController.obtenerUnidadPorConductor
);

/**
 * Endpoints Públicos (Landing Page / Pasajeros)
 */
router.get('/cercana', unidadController.obtenerMasCercana);
router.get('/ruta-demo', unidadController.obtenerRutaDemo);

module.exports = router;