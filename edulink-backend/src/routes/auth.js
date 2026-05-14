const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { registerRules, loginRules, googleAuthRules, forgotPasswordRules, resetPasswordRules } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/login', authLimiter, loginRules, validate, ctrl.login);
router.post('/google', authLimiter, googleAuthRules, validate, ctrl.googleAuth);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, validate, ctrl.resetPassword);

module.exports = router;
