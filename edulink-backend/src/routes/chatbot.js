const router = require('express').Router();
const ctrl = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ctrl.chat);

module.exports = router;
