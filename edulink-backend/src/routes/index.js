const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/appointments', require('./appointments'));
router.use('/messages', require('./messages'));
router.use('/lessons', require('./lessons'));
router.use('/payments', require('./payments'));
router.use('/notifications', require('./notifications'));
router.use('/reviews', require('./reviews'));
router.use('/teacher', require('./teacher'));
router.use('/admin', require('./admin'));
router.use('/livekit', require('./livekit'));

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'EduLink API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
