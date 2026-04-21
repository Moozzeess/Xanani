/**
 * Intención: Expone los endpoints de la API relacionados al recurso [usuario].
 */
const router = require('express').Router();
const usuarioController = require('../controllers/usuario.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/Usuario');

router.post(
  '/',
  requireAuth,
  requireRole([USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR]),
  usuarioController.crearUsuario
);

router.get(
  '/admins',
  requireAuth,
  requireRole([USER_ROLES.SUPERUSUARIO]),
  usuarioController.obtenerAdministradores
);

// Los endpoints de conductores se han movido a conductor.routes.js

// Rutas de Pasajero / Perfil propio
router.get(
  '/perfil',
  requireAuth,
  usuarioController.obtenerPerfil
);

router.put(
  '/perfil',
  requireAuth,
  usuarioController.actualizarPerfil
);

router.post(
  '/favoritos',
  requireAuth,
  usuarioController.gestionarFavorito
);

module.exports = router;
