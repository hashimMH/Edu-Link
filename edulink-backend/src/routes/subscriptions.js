const router = require('express').Router();
const ctrl = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/status', ctrl.getStatus);
router.get('/my', authenticate, ctrl.getMySubscriptions);

module.exports = router;
