const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/userController');
const { uploadController } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProfileRules } = require('../validators/userValidator');

const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }).single('avatar');

router.get('/me', authenticate, ctrl.getProfile);
router.put('/me', authenticate, updateProfileRules, validate, ctrl.updateProfile);
router.post('/avatar', authenticate, avatarUpload, uploadController.uploadAvatar);
router.get('/tutors', ctrl.getTutors);
router.get('/tutors/names', authenticate, ctrl.getTutorNames);
router.get('/tutors/:id', ctrl.getTutorById);

module.exports = router;
