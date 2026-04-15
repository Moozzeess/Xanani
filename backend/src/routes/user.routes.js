const router = require('express').Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { USER_ROLES } = require('../models/User');

// List all users (Super/Admin only)
router.get(
  '/',
  authMiddleware,
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR),
  userController.getUsers
);

// Create user (Super/Admin only)
router.post(
  '/',
  authMiddleware,
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR),
  userController.createUser
);

// Get conductors (Super/Admin only)
router.get(
  '/conductores',
  authMiddleware,
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR),
  userController.getConductores
);

// Get admins (Super only)
router.get(
  '/admins',
  authMiddleware,
  authorizeRoles(USER_ROLES.SUPERUSUARIO),
  userController.getAdmins
);

// Update conductor/user (Super/Admin only)
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR),
  userController.updateConductor
);

// Update user role (Super/Admin only)
router.patch(
  '/:id/role',
  authMiddleware,
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR),
  userController.updateUserRole
);

module.exports = router;
