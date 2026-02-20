const router = require('express').Router();
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');

router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
