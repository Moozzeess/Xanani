const router = require('express').Router();
const rutasAutenticacion = require('./src/routes/autenticacion.routes');
const rutasUsuarios = require('./src/routes/usuario.routes');
const rutasUbicaciones = require('./src/routes/ubicacion.routes');

router.get('/salud', (_, res) => {
  res.json({ estado: 'ok' });
});

router.use('/autenticacion', rutasAutenticacion);
router.use('/usuarios', rutasUsuarios);
router.use('/ubicaciones', rutasUbicaciones);

module.exports = router;
