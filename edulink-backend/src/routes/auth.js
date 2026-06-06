const router = require('express').Router();
const ctrl = require('../controllers/authController');
const firebaseCtrl = require('../controllers/firebaseAuthController');
const { validate } = require('../middleware/validate');
const { registerRules, loginRules, googleAuthRules, forgotPasswordRules, resetPasswordRules } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

// Traditional email/password
router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/login', authLimiter, loginRules, validate, ctrl.login);

// Firebase Auth (Google / Apple Sign-In)
router.post('/firebase', authLimiter, firebaseCtrl.authenticate);

// Refresh token
router.post('/refresh', authLimiter, ctrl.refresh);
router.post('/logout', ctrl.logout);

// Legacy (kept for backward compat)
router.post('/google', authLimiter, googleAuthRules, validate, ctrl.googleAuth);

router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, validate, ctrl.resetPassword);

module.exports = router;
