const express = require('express');
const router = express.Router();
const osrmController = require('../controllers/osrm.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

/**
 * Intención: Definir rutas para el servicio de mapas OSRM.
 * Función: Mapear endpoints a controladores de OSRM.
 * Reglas de negocio:
 *  - No requiere autenticación estricta si se usa para visualización pública de rutas, 
 *    pero puede protegerse con JWT si es necesario.
 */

router.post('/ruta', requireAuth, osrmController.obtenerRuta);

module.exports = router;
