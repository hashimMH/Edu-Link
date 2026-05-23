const router = require('express').Router();
const ctrl = require('../controllers/recordingController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getDetail);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.put('/:id/notes', ctrl.saveNotes);

module.exports = router;
