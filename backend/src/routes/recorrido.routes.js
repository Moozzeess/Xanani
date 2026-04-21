const express = require('express');
const router = express.Router();
const recorridoController = require('../controllers/recorrido.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

/**
 * Rutas para la gestión de recorridos (Viajes).
 */

// Iniciar un nuevo recorrido
router.post('/iniciar', recorridoController.iniciarRecorrido);

// Finalizar un recorrido existente
router.put('/finalizar/:id', recorridoController.finalizarRecorrido);

// Obtener historial de un conductor específico usando el ID de usuario
router.get('/historial/conductor/:userId', recorridoController.obtenerHistorialConductor);

// Obtener el historial global para el administrador
router.get('/historial/admin', requireAuth, requireRole(['ADMINISTRADOR', 'SUPERUSUARIO']), recorridoController.obtenerHistorialAdmin);

// Obtener el recorrido en curso de un conductor
router.get('/activo/:userId', recorridoController.obtenerRecorridoActivo);

// Cancelar/Eliminar un recorrido simulado o de prueba
router.delete('/cancelar/:id', recorridoController.cancelarRecorrido);

module.exports = router;
