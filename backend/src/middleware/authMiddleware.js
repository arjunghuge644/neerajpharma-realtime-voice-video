const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/apiResponse');

/**
 * JWT Authentication Middleware
 * Verifies Bearer token in Authorization header and attaches req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired', 401, 'TOKEN_EXPIRED');
      }
      return errorResponse(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        specialization: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User associated with token no longer exists', 401, 'USER_NOT_FOUND');
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Role-Based Access Control (RBAC) Authorization Middleware
 * @param {...string} allowedRoles - List of permitted roles (e.g. 'PATIENT', 'DOCTOR', 'ADMIN')
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'User authentication required', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource`,
        403,
        'FORBIDDEN'
      );
    }

    return next();
  };
};

module.exports = {
  authenticate,
  authorizeRole,
};
