/**
 * Intención: Expone los endpoints de la API relacionados al recurso [incidente].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `incidente.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const express = require('express');
const router = express.Router();
const incidenteController = require('../controllers/incidente.controller');

// Endpoints para conductores
router.post('/sos', incidenteController.crearSOS);
router.post('/reportar', incidenteController.crearIncidenteConductor);
router.post('/avisos', incidenteController.crearAvisoConductores);
router.get('/avisos/vigentes', incidenteController.obtenerAvisosVigentes);

// Endpoints para administrador
router.get('/admin/lista', incidenteController.obtenerIncidentesAdmin);
router.patch('/admin/gestionar/:id', incidenteController.gestionarEstadoIncidente);

module.exports = router;
