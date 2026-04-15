const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unit.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { USER_ROLES } = require('../models/User');

router.post(
  '/', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR), 
  unitController.createUnit
);

router.get('/', authMiddleware, unitController.getUnits);

router.get('/my-unit', authMiddleware, unitController.getUnitByDriver);

router.put(
  '/:id/hardware', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO), 
  unitController.assignHardware
);

router.put(
  '/:id', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR), 
  unitController.updateUnit
);

router.delete(
  '/:id', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR), 
  unitController.deleteUnit
);

module.exports = router;