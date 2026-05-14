const router = require('express').Router();
const ctrl = require('../controllers/livekitController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/token', ctrl.getToken);

module.exports = router;
