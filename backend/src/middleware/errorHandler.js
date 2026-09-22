const { errorResponse } = require('../utils/apiResponse');

/**
 * Centralized Express Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err.stack || err.message || err);

  // Zod Validation Error Handling
  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, 'Validation error', 400, 'VALIDATION_ERROR', details);
  }

  // Syntax Error (e.g. malformed JSON body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Malformed JSON payload', 400, 'BAD_REQUEST');
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  return errorResponse(res, message, statusCode, code);
};

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
