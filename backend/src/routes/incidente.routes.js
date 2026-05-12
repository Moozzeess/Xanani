/**
 * Intención: Expone los endpoints de la API relacionados al recurso [incidente].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `incidente.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const express = require('express');
const router = express.Router();
const incidenteController = require('../controllers/incidencia.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/Usuario');

// Endpoints para conductores
router.post('/sos', requireAuth, requireRole([USER_ROLES.CONDUCTOR]), incidenteController.crearSOS);
router.post('/reportar', requireAuth, requireRole([USER_ROLES.CONDUCTOR]), incidenteController.crearIncidenteConductor);
router.post('/avisos', requireAuth, requireRole([USER_ROLES.CONDUCTOR, USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), incidenteController.crearAvisoConductores);
router.get('/avisos/vigentes', requireAuth, incidenteController.obtenerAvisosVigentes);

// Endpoints para administrador
router.get('/admin/lista', requireAuth, requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), incidenteController.obtenerIncidentesAdmin);
router.patch('/admin/gestionar/:id', requireAuth, requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), incidenteController.gestionarEstadoIncidente);

module.exports = router;
