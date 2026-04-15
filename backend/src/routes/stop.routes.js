const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stop.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { USER_ROLES } = require('../models/User');

router.post(
  '/', 
  authMiddleware, 
  authorizeRoles(USER_ROLES.SUPERUSUARIO, USER_ROLES.ADMINISTRADOR), 
  stopController.createStop
);

router.get('/', authMiddleware, stopController.getStops);

router.get('/route/:routeId', authMiddleware, stopController.getStopsByRoute);

module.exports = router;