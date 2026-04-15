const express = require('express');
const router = express.Router();

const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { ROLES_USUARIO } = require('../models/User');

router.post('/', authMiddleware, authorizeRoles(ROLES_USUARIO.CONDUCTOR, ROLES_USUARIO.SUPERUSUARIO), locationController.registerLocation);

module.exports = router;