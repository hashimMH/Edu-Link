const { body } = require('express-validator');

const sendMessageRules = [
  body('receiverId').trim().notEmpty().withMessage('Receiver ID is required'),
  body('text').trim().notEmpty().withMessage('Message text is required')
    .isLength({ max: 5000 }).withMessage('Message must be under 5000 characters'),
];

const createRecordingRules = [
  body('classId').trim().notEmpty().withMessage('Class ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('date').trim().notEmpty().withMessage('Date is required'),
  body('duration').optional().trim(),
  body('videoUrl').optional().trim(),
];

const updateRecordingNotesRules = [
  body('notes').optional().isLength({ max: 10000 }).withMessage('Notes must be under 10000 characters'),
];

const createAvailabilityRules = [
  body('dayOfWeek').trim().notEmpty().withMessage('Day of week is required'),
  body('startTime').trim().notEmpty().withMessage('Start time is required'),
  body('endTime').trim().notEmpty().withMessage('End time is required'),
  body('isRecurring').optional().isBoolean().withMessage('isRecurring must be a boolean'),
];

const chatbotRules = [
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ max: 2000 }).withMessage('Message must be under 2000 characters'),
  body('history').optional().isArray().withMessage('History must be an array'),
];

const broadcastNotificationRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('body').trim().notEmpty().withMessage('Body is required')
    .isLength({ max: 1000 }).withMessage('Body must be under 1000 characters'),
];

const sendUserNotificationRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('body').trim().notEmpty().withMessage('Body is required')
    .isLength({ max: 1000 }).withMessage('Body must be under 1000 characters'),
];

const updateLegalPageRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('content').trim().notEmpty().withMessage('Content is required'),
];

module.exports = {
  sendMessageRules,
  createRecordingRules,
  updateRecordingNotesRules,
  createAvailabilityRules,
  chatbotRules,
  broadcastNotificationRules,
  sendUserNotificationRules,
  updateLegalPageRules,
};
