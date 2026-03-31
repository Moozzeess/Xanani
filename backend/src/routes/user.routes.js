const router = require('express').Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { ROLES_USUARIO } = require('../models/Usuario');

router.post(
  '/',
  authMiddleware,
  authorizeRoles(ROLES_USUARIO.SUPERUSUARIO, ROLES_USUARIO.ADMINISTRADOR),
  userController.createUser
);

router.patch(
  '/:id/role',
  authMiddleware,
  authorizeRoles(ROLES_USUARIO.SUPERUSUARIO, ROLES_USUARIO.ADMINISTRADOR),
  userController.updateUserRole
);

module.exports = router;
