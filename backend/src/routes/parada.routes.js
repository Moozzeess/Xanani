/**
 * Intención: Expone los endpoints de la API relacionados al recurso [parada].
 * Controladores asociados: Administra operaciones CRUD y reglas de negocio conectadas a `parada.controller`.
 * Reglas de negocio:
 *  - Intercepta middlewares de protección (JWT/Roles) antes de otorgar acceso directo a los controladores.
 */
const express = require('express');
const router = express.Router();

const paradaController = require('../controllers/parada.controller');

router.post('/', paradaController.crearParada);

router.get('/', paradaController.obtenerParadas);

router.get('/ruta/:rutaId', paradaController.obtenerParadasPorRuta);

module.exports = router;