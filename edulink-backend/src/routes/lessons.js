const router = require('express').Router();
const ctrl = require('../controllers/lessonController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/history', ctrl.getHistory);

module.exports = router;
