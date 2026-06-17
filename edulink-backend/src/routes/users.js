const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { uploadController } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProfileRules } = require('../validators/userValidator');

router.get('/me', authenticate, ctrl.getProfile);
router.put('/me', authenticate, updateProfileRules, validate, ctrl.updateProfile);
router.post('/avatar', authenticate, uploadController.uploadAvatar);
router.get('/tutors', ctrl.getTutors);
router.get('/tutors/names', authenticate, ctrl.getTutorNames);
router.get('/tutors/:id', ctrl.getTutorById);

module.exports = router;
