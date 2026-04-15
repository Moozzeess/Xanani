const express = require('express');
const router = express.Router();

const paradaController = require('../controllers/parada.controller');

router.post('/', paradaController.crearParada);

router.get('/', paradaController.obtenerParadas);

router.get('/ruta/:rutaId', paradaController.obtenerParadasPorRuta);

module.exports = router;