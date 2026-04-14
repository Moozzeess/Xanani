const express = require('express');
const router = express.Router();

const unitController = require('../controllers/unit.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/roleAuth.middleware');
const { ROLES_USUARIO } = require('../models/Usuario');

router.post('/', authMiddleware, authorizeRoles(ROLES_USUARIO.SUPERUSUARIO, ROLES_USUARIO.ADMINISTRADOR), unitController.createUnit);
router.get('/', authMiddleware, unitController.getUnits);

module.exports = router;