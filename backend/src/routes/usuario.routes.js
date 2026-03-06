const router = require('express').Router();
const controladorUsuario = require('../controllers/usuario.controller');
const { requerirAutenticacion, requerirRol } = require('../middlewares/autenticacion.middleware');
const { ROLES_USUARIO } = require('../models/Usuario');

router.post(
  '/',
  requerirAutenticacion,
  requerirRol([ROLES_USUARIO.SUPERUSUARIO, ROLES_USUARIO.ADMINISTRADOR]),
  controladorUsuario.crearUsuario
);

module.exports = router;
