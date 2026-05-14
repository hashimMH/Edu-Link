const { body } = require('express-validator');

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must include a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must include a special character'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const googleAuthRules = [
  body('googleId').notEmpty().withMessage('Google ID is required'),
  body('email').isEmail().normalizeEmail(),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must include a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must include a special character'),
];

module.exports = { registerRules, loginRules, googleAuthRules, forgotPasswordRules, resetPasswordRules };
