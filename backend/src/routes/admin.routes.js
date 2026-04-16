/**
 * Intención: Expone los endpoints de la API relacionados al recurso [admin].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `admin.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const express = require('express');
const router = express.Router();
//const adminController = require('../controllers/admin.controller');

// Obtener estadísticas para el dashboard
//router.get('/dashboard/stats', adminController.obtenerEstadisticasDashboard);

// Obtener estado de la flotilla (ubicaciones y estados)
//router.get('/flotilla/estado', adminController.obtenerEstadoFlotilla);

module.exports = router;
