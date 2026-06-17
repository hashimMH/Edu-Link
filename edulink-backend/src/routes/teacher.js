const router = require('express').Router();
const ctrl = require('../controllers/teacherController');
const { uploadController } = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAvailabilityRules } = require('../validators/generalValidator');

router.use(authenticate);
router.use(authorize('teacher'));

router.get('/stats', ctrl.getStats);
router.get('/classes', ctrl.getClasses);
router.get('/upcoming', ctrl.getUpcomingClass);
router.delete('/classes/:id', ctrl.deleteClass);
router.post('/availability', createAvailabilityRules, validate, ctrl.setAvailability);
router.get('/availability', ctrl.getAvailability);
router.delete('/availability/:id', ctrl.deleteAvailability);

// Tutor profile editing
router.put('/tutor-profile', uploadController.updateTutorProfile);
router.post('/upload-video', uploadController.uploadVideo);
router.post('/upload-certificate', uploadController.uploadCertificate);
router.get('/certificates', uploadController.getCertificates);
router.delete('/certificates/:id', uploadController.deleteCertificate);

module.exports = router;
