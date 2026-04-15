const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { USER_ROLES } = require('../models/User');

// Solo conductores o superusuarios pueden registrar ubicación
router.post(
  '/', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.CONDUCTOR, USER_ROLES.SUPERUSUARIO), 
  locationController.registerLocation
);

module.exports = router;