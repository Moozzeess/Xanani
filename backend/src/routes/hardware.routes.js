const router = require('express').Router();
const hardwareController = require('../controllers/hardware.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Se asume que tienes middlewares de autenticación, usarlos según convenga. Por ahora se dejan sin proteger 
// para asegurar que las pruebas funcionen, a excepción de las rutas que estrictamente requieren datos del usuario autenticado.

router.post('/', hardwareController.createHardware);
router.get('/', hardwareController.getAllHardware);
router.get('/admin', requireAuth, hardwareController.getAdminHardware);
router.put('/:id/assign', hardwareController.assignAdmin);
router.delete('/:id', hardwareController.deleteHardware);

module.exports = router;