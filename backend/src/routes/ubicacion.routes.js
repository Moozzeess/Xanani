/**
 * Intención: Expone los endpoints de la API relacionados al recurso [ubicacion].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `ubicacion.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const express = require('express');
const router = express.Router();

const ubicacionController = require('../controllers/ubicacion.controller');

router.post('/', ubicacionController.registrarUbicacion);

module.exports = router;