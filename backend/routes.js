const router = require('express').Router();
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const locationRoutes = require('./src/routes/location.routes');

router.get('/salud', (_, res) => {
  res.json({ estado: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);

module.exports = router;
