const { body } = require('express-validator');

const updateProfileRules = [
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must include a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must include a special character'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
];

module.exports = { updateProfileRules };
