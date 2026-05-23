const router = require('express').Router();
const ctrl = require('../controllers/savedTutorController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:tutorId/status', ctrl.checkStatus);
router.post('/:tutorId', ctrl.save);
router.delete('/:tutorId', ctrl.remove);

module.exports = router;
