const jwt = require('jsonwebtoken');
const env = require('../config/env');

const token = {
  sign(payload, expiresIn) {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: expiresIn || env.JWT_EXPIRES_IN,
    });
  },

  verify(tokenString) {
    return jwt.verify(tokenString, env.JWT_SECRET);
  },
};

module.exports = token;
