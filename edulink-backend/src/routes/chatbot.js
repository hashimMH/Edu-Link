const router = require('express').Router();
const ctrl = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { chatbotRules } = require('../validators/generalValidator');

router.post('/', authenticate, chatbotRules, validate, ctrl.chat);

module.exports = router;
