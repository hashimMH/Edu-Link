const router = require('express').Router();
const ctrl = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getConversations);
router.get('/:chatId', ctrl.getChatMessages);
router.post('/', ctrl.sendMessage);

module.exports = router;
