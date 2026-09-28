const { Server } = require('socket.io');
const config = require('../config/env');
const socketAuthMiddleware = require('./authMiddleware');
const { joinUserRoom, joinCallRoom, leaveCallRoom } = require('./roomManager');
const registerCallLifecycleHandlers = require('./callLifecycleHandler');
const registerSignalingHandlers = require('./signalingHandler');

let io = null;

/**
 * Initialize Socket.IO Server Engine attached to HTTP server
 */
const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Apply JWT Auth Middleware to all socket connections
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`⚡ [Socket Connected] ${socket.user.name} (${socket.user.email}) - SocketID: ${socket.id}`);

    // Automatically join user to personal notification room
    joinUserRoom(socket);

    // Register Call Lifecycle & WebRTC Signaling Event Handlers
    registerCallLifecycleHandlers(io, socket);
    registerSignalingHandlers(io, socket);

    // Handle joining protected call room
    socket.on('room:join', async (data, callback) => {
      try {
        const appointmentId = typeof data === 'string' ? data : data?.appointmentId;
        if (!appointmentId) {
          if (callback) callback({ success: false, message: 'Appointment ID required' });
          return;
        }

        const roomInfo = await joinCallRoom(socket, appointmentId);
        if (callback) {
          callback({
            success: true,
            roomId: roomInfo.callRoom,
            userRole: roomInfo.role,
          });
        }
      } catch (err) {
        if (callback) {
          callback({
            success: false,
            message: err.message || 'Failed to join call room',
            code: err.code || 'ROOM_JOIN_ERROR',
          });
        }
      }
    });

    // Handle leaving room
    socket.on('room:leave', (data) => {
      const appointmentId = typeof data === 'string' ? data : data?.appointmentId;
      if (appointmentId) {
        leaveCallRoom(socket, appointmentId);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket Disconnected] ${socket.user.name} (${socket.user.email}) - Reason: ${reason}`);
    });
  });

  return io;
};


/**
 * Get active Socket.IO server instance
 */
const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return io;
};

module.exports = {
  initSocketServer,
  getIo,
};
