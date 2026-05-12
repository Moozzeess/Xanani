/**
 * Intención: Expone los endpoints de la API relacionados al recurso [parada].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `parada.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const express = require('express');
const router = express.Router();

const paradaController = require('../controllers/parada.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/Usuario');

router.post('/', requireAuth, requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), paradaController.crearParada);

router.get('/', requireAuth, paradaController.obtenerParadas);

router.get('/ruta/:rutaId', requireAuth, paradaController.obtenerParadasPorRuta);

module.exports = router;