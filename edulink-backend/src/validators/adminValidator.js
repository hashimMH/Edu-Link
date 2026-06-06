const { body } = require('express-validator');

const createUserRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must include a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must include a special character'),
  body('role').isIn(['student', 'teacher', 'admin']).withMessage('Role must be student, teacher, or admin'),
];

const updateUserRules = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must include a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must include a special character'),
  body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const updateTutorAdminRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('accent').optional().trim(),
  body('country').optional().trim(),
  body('description').optional().trim(),
  body('videoUrl').optional().trim(),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
  body('interests').optional().isArray().withMessage('Interests must be an array'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be 0-5'),
];

const createSubscriptionRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('lessons').isInt({ min: 1 }).withMessage('Lessons must be at least 1'),
  body('duration').trim().notEmpty().withMessage('Duration is required'),
];

const updateSubscriptionRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('lessons').optional().isInt({ min: 1 }).withMessage('Lessons must be at least 1'),
  body('duration').optional().trim().notEmpty().withMessage('Duration cannot be empty'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const createLessonRules = [
  body('userId').trim().notEmpty().withMessage('User ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('duration').trim().notEmpty().withMessage('Duration is required'),
  body('description').optional().trim(),
  body('videoUrl').optional().trim(),
];

const updateLessonRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('duration').optional().trim().notEmpty().withMessage('Duration cannot be empty'),
  body('description').optional().trim(),
  body('videoUrl').optional().trim(),
];

module.exports = {
  createUserRules,
  updateUserRules,
  updateTutorAdminRules,
  createSubscriptionRules,
  updateSubscriptionRules,
  createLessonRules,
  updateLessonRules,
};
