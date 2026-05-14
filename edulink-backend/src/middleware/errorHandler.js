const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Global error handler. Catches both operational and unexpected errors.
 */
function errorHandler(err, req, res, _next) {
  // Log the error
  if (err.isOperational) {
    logger.warn(`${err.statusCode} - ${err.message}`);
  } else {
    logger.error('Unexpected error:', err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  const response = {
    success: false,
    message,
  };

  if (err.errors && err.errors.length > 0) {
    response.errors = err.errors;
  }

  // In dev mode, include stack trace
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler for unmatched routes.
 */
function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

module.exports = { errorHandler, notFound };
