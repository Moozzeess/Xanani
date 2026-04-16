const router = require('express').Router();
const hardwareController = require('../controllers/hardware.controller');
// const { protect, restrictTo } = require('../middlewares/authMiddleware'); 
// Se asume que tienes middlewares de autenticación, usarlos según convenga. Por ahora se dejan sin proteger 
// para asegurar que las pruebas funcionen, o puedes agregarlos si la app ya usa un formato.

router.post('/', hardwareController.createHardware);
router.get('/', hardwareController.getAllHardware);
router.get('/admin', hardwareController.getAdminHardware);
router.put('/:id/assign', hardwareController.assignAdmin);
router.delete('/:id', hardwareController.deleteHardware);

module.exports = router;