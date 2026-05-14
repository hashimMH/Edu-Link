const tokenUtil = require('../utils/token');
const ApiError = require('../utils/ApiError');

/**
 * Protects routes - requires valid JWT token.
 * Decodes user info and attaches to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }

  const tokenString = authHeader.split(' ')[1];

  try {
    const decoded = tokenUtil.verify(tokenString);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    return next(ApiError.unauthorized('Invalid token'));
  }
}

/**
 * Restricts access to specific roles.
 * Must be used AFTER authenticate middleware.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    next();
  };
}

/**
 * Optional auth - attaches user if token present, but doesn't fail.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  try {
    const decoded = tokenUtil.verify(authHeader.split(' ')[1]);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
  } catch (_) {
    // Ignore invalid tokens in optional auth
  }
  next();
}

module.exports = { authenticate, authorize, optionalAuth };
