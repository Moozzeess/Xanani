/**
 * Intención: Expone los endpoints de la API relacionados al recurso [recorrido].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `recorrido.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const express = require('express');
const router = express.Router();
const recorridoController = require('../controllers/recorrido.controller');

/**
 * Rutas para la gestión de recorridos (Viajes).
 */

// Iniciar un nuevo recorrido
router.post('/iniciar', recorridoController.iniciarRecorrido);

// Finalizar un recorrido existente
router.put('/finalizar/:id', recorridoController.finalizarRecorrido);

// Obtener historial de un conductor específico usando el ID de usuario
router.get('/historial/conductor/:userId', recorridoController.obtenerHistorialConductor);

// Obtener el recorrido en curso de un conductor
router.get('/activo/:userId', recorridoController.obtenerRecorridoActivo);

// Cancelar/Eliminar un recorrido simulado o de prueba
router.delete('/cancelar/:id', recorridoController.cancelarRecorrido);

module.exports = router;
