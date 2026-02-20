const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/User');

router.post(
  '/',
  requireAuth,
  requireRole([USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR]),
  userController.createUser
);

module.exports = router;
