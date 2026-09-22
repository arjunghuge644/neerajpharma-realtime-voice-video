const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate a signed JWT Token
 * @param {object} payload - Identity claims (id, email, role)
 * @returns {string} Signed JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify and decode a JWT Token
 * @param {string} token - Bearer token string
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

module.exports = {
  generateToken,
  verifyToken,
};
