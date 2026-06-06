const router = require('express').Router();
const ctrl = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sendMessageRules } = require('../validators/generalValidator');

router.use(authenticate);

router.get('/', ctrl.getConversations);
router.get('/:chatId', ctrl.getChatMessages);
router.post('/', sendMessageRules, validate, ctrl.sendMessage);

module.exports = router;
