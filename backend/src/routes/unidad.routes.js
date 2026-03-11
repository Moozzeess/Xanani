const express = require('express');
const router = express.Router();

const unidadController = require('../controllers/unidad.controller');

router.post('/', unidadController.crearUnidad);
router.get('/', unidadController.obtenerUnidades);

module.exports = router;