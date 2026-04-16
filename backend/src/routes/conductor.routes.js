const express = require('express');
const router = express.Router();
const conductorController = require('../controllers/conductor.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/Usuario');

/**
 * @route   GET /api/conductores
 * @desc    Obtener todos los conductores (Solo Admin/Superuser)
 */
router.get(
  '/', 
  requireAuth, 
  requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), 
  conductorController.obtenerConductores
);

/**
 * @route   POST /api/conductores
 * @desc    Crear nuevo conductor (Solo Admin/Superuser)
 */
router.post(
  '/', 
  requireAuth, 
  requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), 
  conductorController.crearConductor
);

/**
 * @route   GET /api/conductores/perfil
 * @desc    Obtener perfil del conductor autenticado
 */
router.get(
  '/perfil', 
  requireAuth, 
  conductorController.obtenerMiPerfil
);

/**
 * @route   PUT /api/conductores/:id
 * @desc    Actualizar ficha de conductor (Solo Admin/Superuser)
 */
router.put(
  '/:id', 
  requireAuth, 
  requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), 
  conductorController.actualizarConductor
);

module.exports = router;
