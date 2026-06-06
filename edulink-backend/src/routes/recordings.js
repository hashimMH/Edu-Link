const router = require('express').Router();
const ctrl = require('../controllers/recordingController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createRecordingRules, updateRecordingNotesRules } = require('../validators/generalValidator');

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getDetail);
router.post('/', createRecordingRules, validate, ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.put('/:id/notes', updateRecordingNotesRules, validate, ctrl.saveNotes);

module.exports = router;
