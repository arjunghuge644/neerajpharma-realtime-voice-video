const appointmentService = require('../services/appointmentService');

/**
 * Join user to their personal direct alert room (user_{userId})
 */
const joinUserRoom = (socket) => {
  const userRoom = `user_${socket.userId}`;
  socket.join(userRoom);
  console.log(`[Socket RoomManager] User ${socket.user.email} joined personal room: ${userRoom}`);
};

/**
 * Join socket to a protected call room (call_{appointmentId}) after verifying appointment membership
 */
const joinCallRoom = async (socket, appointmentId) => {
  try {
    const { appointment, isPatient, isDoctor } = await appointmentService.validateAppointmentForCall(
      appointmentId,
      socket.userId
    );

    const callRoom = `call_${appointmentId}`;
    socket.join(callRoom);
    console.log(
      `[Socket RoomManager] ${socket.user.role} ${socket.user.email} joined call room: ${callRoom}`
    );

    return {
      success: true,
      callRoom,
      appointment,
      role: isPatient ? 'PATIENT' : isDoctor ? 'DOCTOR' : 'ADMIN',
    };
  } catch (error) {
    console.error(
      `[Socket RoomManager] Unauthorized room join attempt by ${socket.user.email} for appointment ${appointmentId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Leave a call room
 */
const leaveCallRoom = (socket, appointmentId) => {
  const callRoom = `call_${appointmentId}`;
  socket.leave(callRoom);
  console.log(`[Socket RoomManager] User ${socket.user.email} left call room: ${callRoom}`);
};

module.exports = {
  joinUserRoom,
  joinCallRoom,
  leaveCallRoom,
};
