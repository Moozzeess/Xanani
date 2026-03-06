const router = require('express').Router();
const controladorAutenticacion = require('../controllers/autenticacion.controller');

router.post('/registrar', controladorAutenticacion.registrar);
router.post('/iniciar-sesion', controladorAutenticacion.iniciarSesion);

module.exports = router;
