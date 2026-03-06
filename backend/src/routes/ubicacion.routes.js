const router = require('express').Router();
const controladorUbicacion = require('../controllers/ubicacion.controller');
const { requerirAutenticacion, requerirRol } = require('../middlewares/autenticacion.middleware');
const { ROLES_USUARIO } = require('../models/Usuario');

router.post(
  '/actualizar',
  requerirAutenticacion,
  requerirRol([ROLES_USUARIO.CONDUCTOR, ROLES_USUARIO.ADMINISTRADOR, ROLES_USUARIO.SUPERUSUARIO]),
  controladorUbicacion.actualizarUbicacion
);

module.exports = router;
