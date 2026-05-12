const express = require('express');
const router = express.Router();
const recorridoController = require('../controllers/recorrido.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/Usuario');

/**
 * Rutas para la gestión de recorridos (Viajes).
 */

// Iniciar un nuevo recorrido
router.post('/iniciar', requireAuth, requireRole([USER_ROLES.CONDUCTOR]), recorridoController.iniciarRecorrido);

// Finalizar un recorrido existente
router.put('/finalizar/:id', requireAuth, requireRole([USER_ROLES.CONDUCTOR]), recorridoController.finalizarRecorrido);

// Obtener historial de un conductor específico usando el ID de usuario
router.get('/historial/conductor/:userId', requireAuth, recorridoController.obtenerHistorialConductor);

// Obtener el historial global para el administrador
router.get('/historial/admin', requireAuth, requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), recorridoController.obtenerHistorialAdmin);

// Obtener el recorrido en curso de un conductor
router.get('/activo/:userId', requireAuth, recorridoController.obtenerRecorridoActivo);

// Cancelar/Eliminar un recorrido simulado o de prueba
router.delete('/cancelar/:id', requireAuth, requireRole([USER_ROLES.ADMINISTRADOR, USER_ROLES.SUPERUSUARIO]), recorridoController.cancelarRecorrido);

module.exports = router;
