const prisma = require('../config/prisma');
const config = require('../config/env');
const callService = require('../services/callService');
const { joinCallRoom } = require('./roomManager');

// Ringing timers map: key = callSessionId, value = setTimeout ID
const ringingTimers = new Map();

/**
 * Register Call Lifecycle Socket Event Handlers
 */
const registerCallLifecycleHandlers = (io, socket) => {
  /**
   * Handle Call Initiation from Client (call:initiate)
   */
  socket.on('call:initiate', async (data, callback) => {
    try {
      const { appointmentId, callType } = data || {};
      if (!appointmentId) {
        if (callback) callback({ success: false, message: 'Appointment ID required' });
        return;
      }

      // 1. Create CallSession in DB & validate appointment gating
      const result = await callService.initiateCallSession({
        appointmentId,
        callType: callType || 'VIDEO',
        callerId: socket.userId,
      });

      const { callSession, targetUserId, iceServers } = result;
      const callRoom = `call_${appointmentId}`;
      const targetUserRoom = `user_${targetUserId}`;

      // 2. Join caller socket to call room
      await joinCallRoom(socket, appointmentId);

      // 3. Emit call:incoming to target user's direct socket room
      io.to(targetUserRoom).emit('call:incoming', {
        callSessionId: callSession.id,
        appointmentId,
        callType: callSession.callType,
        caller: {
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
          role: socket.user.role,
        },
        roomId: callRoom,
        initiatedAt: callSession.initiatedAt,
      });

      // 4. Emit call:ringing back to caller
      socket.emit('call:ringing', {
        callSessionId: callSession.id,
        appointmentId,
        roomId: callRoom,
      });

      // 5. Start Ringing Timeout Timer (default 30s)
      const timeoutMs = config.callTimeoutSeconds * 1000;
      const timerId = setTimeout(async () => {
        try {
          ringingTimers.delete(callSession.id);

          const currentSession = await prisma.callSession.findUnique({
            where: { id: callSession.id },
          });

          if (currentSession && (currentSession.status === 'INITIATED' || currentSession.status === 'RINGING')) {
            const endedAt = new Date();
            await prisma.callSession.update({
              where: { id: callSession.id },
              data: {
                status: 'MISSED',
                endTime: endedAt,
                duration: 0,
              },
            });

            console.log(`⏰ [Call Timeout] Session ${callSession.id} timed out after ${config.callTimeoutSeconds}s -> MISSED`);

            io.to(callRoom).emit('call:timeout', {
              callSessionId: callSession.id,
              message: 'Call attempt timed out. No response from recipient.',
            });
            io.to(targetUserRoom).emit('call:timeout', {
              callSessionId: callSession.id,
              message: 'Missed call notification',
            });
          }
        } catch (err) {
          console.error('[Call Timeout Error]:', err);
        }
      }, timeoutMs);

      ringingTimers.set(callSession.id, timerId);

      if (callback) {
        callback({
          success: true,
          callSessionId: callSession.id,
          roomId: callRoom,
          iceServers,
        });
      }
    } catch (error) {
      console.error(`[Socket call:initiate Error]:`, error.message);
      if (callback) {
        callback({
          success: false,
          message: error.message,
          code: error.code || 'CALL_INITIATE_ERROR',
        });
      }
    }
  });

  /**
   * Handle Call Acceptance by Doctor (call:accept)
   */
  socket.on('call:accept', async (data, callback) => {
    try {
      const { callSessionId } = data || {};
      if (!callSessionId) {
        if (callback) callback({ success: false, message: 'Call Session ID required' });
        return;
      }

      // Clear ringing timeout timer if active
      if (ringingTimers.has(callSessionId)) {
        clearTimeout(ringingTimers.get(callSessionId));
        ringingTimers.delete(callSessionId);
      }

      const callSession = await prisma.callSession.findUnique({
        where: { id: callSessionId },
      });

      if (!callSession) {
        if (callback) callback({ success: false, message: 'Call session not found' });
        return;
      }

      const startTime = new Date();
      const updatedSession = await prisma.callSession.update({
        where: { id: callSessionId },
        data: {
          status: 'CONNECTED',
          startTime,
        },
      });

      // Join callee to call room
      const callRoom = `call_${callSession.appointmentId}`;
      await joinCallRoom(socket, callSession.appointmentId);

      // Notify both participants in room that call has been accepted
      io.to(callRoom).emit('call:accepted', {
        callSessionId,
        appointmentId: callSession.appointmentId,
        startTime,
        acceptedBy: {
          id: socket.user.id,
          name: socket.user.name,
        },
      });

      if (callback) {
        callback({
          success: true,
          callSession: updatedSession,
          iceServers: callService.getIceServersConfig(),
        });
      }
    } catch (error) {
      console.error(`[Socket call:accept Error]:`, error.message);
      if (callback) callback({ success: false, message: error.message });
    }
  });

  /**
   * Handle Call Rejection by Callee (call:reject)
   */
  socket.on('call:reject', async (data, callback) => {
    try {
      const { callSessionId, reason } = data || {};
      if (!callSessionId) return;

      if (ringingTimers.has(callSessionId)) {
        clearTimeout(ringingTimers.get(callSessionId));
        ringingTimers.delete(callSessionId);
      }

      const callSession = await prisma.callSession.findUnique({
        where: { id: callSessionId },
      });

      if (callSession) {
        const endTime = new Date();
        await prisma.callSession.update({
          where: { id: callSessionId },
          data: {
            status: 'REJECTED',
            endTime,
            duration: 0,
          },
        });

        const callRoom = `call_${callSession.appointmentId}`;
        io.to(callRoom).emit('call:rejected', {
          callSessionId,
          reason: reason || 'Call declined by recipient',
        });
      }

      if (callback) callback({ success: true });
    } catch (error) {
      console.error(`[Socket call:reject Error]:`, error.message);
      if (callback) callback({ success: false, message: error.message });
    }
  });

  /**
   * Handle Call Termination (call:end)
   */
  socket.on('call:end', async (data, callback) => {
    try {
      const { callSessionId } = data || {};
      if (!callSessionId) return;

      if (ringingTimers.has(callSessionId)) {
        clearTimeout(ringingTimers.get(callSessionId));
        ringingTimers.delete(callSessionId);
      }

      const updatedSession = await callService.endCallSession(callSessionId, socket.userId);
      const callRoom = `call_${updatedSession.appointmentId}`;

      io.to(callRoom).emit('call:ended', {
        callSessionId,
        duration: updatedSession.duration,
        endedBy: socket.user.id,
      });

      if (callback) callback({ success: true, duration: updatedSession.duration });
    } catch (error) {
      console.error(`[Socket call:end Error]:`, error.message);
      if (callback) callback({ success: false, message: error.message });
    }
  });
};

module.exports = registerCallLifecycleHandlers;
