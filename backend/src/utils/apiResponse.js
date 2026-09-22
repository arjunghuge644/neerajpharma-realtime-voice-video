/**
 * Standardized API Response Utilities
 */

/**
 * Send a success response envelope.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {object} [data={}]
 * @param {number} [statusCode=200]
 */
const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response envelope.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {string} [code='SERVER_ERROR']
 * @param {Array} [details=[]]
 */
const errorResponse = (res, message, statusCode = 500, code = 'SERVER_ERROR', details = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
