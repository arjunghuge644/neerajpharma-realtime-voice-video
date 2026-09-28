/**
 * Register WebRTC Signaling Event Handlers (webrtc:offer, webrtc:answer, webrtc:ice-candidate)
 */
const registerSignalingHandlers = (io, socket) => {
  /**
   * Relay WebRTC Offer (webrtc:offer)
   */
  socket.on('webrtc:offer', (data) => {
    const { appointmentId, sdp } = data || {};
    if (!appointmentId || !sdp) {
      console.warn(`[WebRTC Relay] Invalid offer payload from ${socket.user.email}`);
      return;
    }

    const callRoom = `call_${appointmentId}`;
    socket.to(callRoom).emit('webrtc:offer', {
      appointmentId,
      sdp,
      senderId: socket.userId,
    });
  });

  /**
   * Relay WebRTC Answer (webrtc:answer)
   */
  socket.on('webrtc:answer', (data) => {
    const { appointmentId, sdp } = data || {};
    if (!appointmentId || !sdp) {
      console.warn(`[WebRTC Relay] Invalid answer payload from ${socket.user.email}`);
      return;
    }

    const callRoom = `call_${appointmentId}`;
    socket.to(callRoom).emit('webrtc:answer', {
      appointmentId,
      sdp,
      senderId: socket.userId,
    });
  });

  /**
   * Relay WebRTC ICE Candidate (webrtc:ice-candidate)
   */
  socket.on('webrtc:ice-candidate', (data) => {
    const { appointmentId, candidate } = data || {};
    if (!appointmentId || !candidate) {
      return;
    }

    const callRoom = `call_${appointmentId}`;
    socket.to(callRoom).emit('webrtc:ice-candidate', {
      appointmentId,
      candidate,
      senderId: socket.userId,
    });
  });
};

module.exports = registerSignalingHandlers;
