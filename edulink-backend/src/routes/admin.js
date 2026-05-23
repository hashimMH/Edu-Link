const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');

// Simple admin check — in production replace with proper role-based check
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'teacher') {
    // For dev: allow teachers as admins. In production add a proper admin role.
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
router.post('/users', ctrl.createUser);
router.put('/users/:id', ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);

// Tutors
router.get('/tutors', ctrl.getAllTutorsAdmin);
router.put('/tutors/:id', ctrl.updateTutorAdmin);

// Subscriptions
router.get('/subscriptions', ctrl.getAllSubscriptionsAdmin);
router.post('/subscriptions', ctrl.createSubscription);
router.put('/subscriptions/:id', ctrl.updateSubscription);
router.delete('/subscriptions/:id', ctrl.deleteSubscription);

// Global subscriptions master switch
router.get('/subscriptions-master', ctrl.getSubscriptionsMasterSwitch);
router.put('/subscriptions-master', ctrl.toggleSubscriptionsMasterSwitch);

// Lessons
router.get('/lessons', ctrl.getAllLessonsAdmin);
router.post('/lessons', ctrl.createLesson);
router.put('/lessons/:id', ctrl.updateLesson);
router.delete('/lessons/:id', ctrl.deleteLesson);

// Appointments
router.get('/appointments', ctrl.getAllAppointmentsAdmin);

// Payments
router.get('/payments', ctrl.getAllPaymentsAdmin);

// Notifications
router.post('/notifications/broadcast', ctrl.broadcastNotification);
router.post('/notifications/user/:userId', ctrl.sendUserNotification);

// Legal pages
router.get('/legal', ctrl.getLegalPages);
router.put('/legal/:key', ctrl.updateLegalPage);

module.exports = router;
