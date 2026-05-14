const { body } = require('express-validator');

const createAppointmentRules = [
  body('tutorId').notEmpty().withMessage('Tutor ID is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('day').notEmpty().withMessage('Day is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
];

module.exports = { createAppointmentRules };
