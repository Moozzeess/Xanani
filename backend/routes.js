const router = require('express').Router();

router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
