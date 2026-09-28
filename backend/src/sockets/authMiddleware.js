const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');

/**
 * Socket.IO Connection Handshake Authentication Middleware
 * Intercepts incoming WebSocket connection and validates JWT token.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!authHeader) {
      return next(new Error('Authentication error: Missing token'));
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      }
      return next(new Error('Authentication error: Invalid token'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        specialization: true,
      },
    });

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user profile to socket instance
    socket.user = user;
    socket.userId = user.id;

    return next();
  } catch (error) {
    return next(new Error('Authentication error: Server exception during handshake'));
  }
};

module.exports = socketAuthMiddleware;
