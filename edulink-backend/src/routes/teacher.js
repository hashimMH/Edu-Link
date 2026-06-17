const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/teacherController');
const { uploadController } = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAvailabilityRules } = require('../validators/generalValidator');

// Multer memory storage — files go straight to S3
const videoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }).single('video');
const certUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single('certificate');

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
router.post('/upload-video', videoUpload, uploadController.uploadVideo);
router.post('/upload-certificate', certUpload, uploadController.uploadCertificate);
router.get('/certificates', uploadController.getCertificates);
router.delete('/certificates/:id', uploadController.deleteCertificate);

module.exports = router;
