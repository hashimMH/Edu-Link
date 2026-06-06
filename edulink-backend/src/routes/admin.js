const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createUserRules, updateUserRules, updateTutorAdminRules,
  createSubscriptionRules, updateSubscriptionRules,
  createLessonRules, updateLessonRules,
} = require('../validators/adminValidator');
const {
  broadcastNotificationRules, sendUserNotificationRules,
  updateLegalPageRules,
} = require('../validators/generalValidator');

// Admin role check — only admin role allowed
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

router.use(authenticate);
router.use(adminOnly);

// Dashboard
router.get('/stats', ctrl.getStats);

// Users
router.get('/users', ctrl.getAllUsers);
router.get('/users/:id', ctrl.getUserById);
router.post('/users', createUserRules, validate, ctrl.createUser);
router.put('/users/:id', updateUserRules, validate, ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);

// Tutors
router.get('/tutors', ctrl.getAllTutorsAdmin);
router.put('/tutors/:id', updateTutorAdminRules, validate, ctrl.updateTutorAdmin);

// Subscriptions
router.get('/subscriptions', ctrl.getAllSubscriptionsAdmin);
router.post('/subscriptions', createSubscriptionRules, validate, ctrl.createSubscription);
router.put('/subscriptions/:id', updateSubscriptionRules, validate, ctrl.updateSubscription);
router.delete('/subscriptions/:id', ctrl.deleteSubscription);

// Global subscriptions master switch
router.get('/subscriptions-master', ctrl.getSubscriptionsMasterSwitch);
router.put('/subscriptions-master', ctrl.toggleSubscriptionsMasterSwitch);

// Lessons
router.get('/lessons', ctrl.getAllLessonsAdmin);
router.post('/lessons', createLessonRules, validate, ctrl.createLesson);
router.put('/lessons/:id', updateLessonRules, validate, ctrl.updateLesson);
router.delete('/lessons/:id', ctrl.deleteLesson);

// Appointments
router.get('/appointments', ctrl.getAllAppointmentsAdmin);

// Payments
router.get('/payments', ctrl.getAllPaymentsAdmin);

// Notifications
router.post('/notifications/broadcast', broadcastNotificationRules, validate, ctrl.broadcastNotification);
router.post('/notifications/user/:userId', sendUserNotificationRules, validate, ctrl.sendUserNotification);

// Legal pages
router.get('/legal', ctrl.getLegalPages);
router.put('/legal/:key', updateLegalPageRules, validate, ctrl.updateLegalPage);

module.exports = router;
