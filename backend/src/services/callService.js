const prisma = require('../config/prisma');
const config = require('../config/env');
const appointmentService = require('./appointmentService');

/**
 * Get STUN/TURN ICE Servers Configuration
 */
const getIceServersConfig = () => {
  const iceServers = [
    { urls: config.stunServer },
  ];

  if (config.turnServer) {
    iceServers.push({
      urls: config.turnServer,
      username: config.turnUsername,
      credential: config.turnPassword,
    });
  }

  return iceServers;
};

/**
 * Initiate a new call session REST endpoint handler
 */
const initiateCallSession = async ({ appointmentId, callType, callerId }) => {
  // 1. Validate appointment gating (caller must be patient or doctor assigned to appointment)
  const { appointment, isPatient, targetUserId } = await appointmentService.validateAppointmentForCall(
    appointmentId,
    callerId
  );

  // 2. Check if either participant is currently engaged in an active call session
  const activeCall = await prisma.callSession.findFirst({
    where: {
      OR: [
        { patientId: appointment.patientId },
        { doctorId: appointment.doctorId },
      ],
      status: {
        in: ['INITIATED', 'RINGING', 'ACCEPTED', 'ONGOING'],
      },
    },
  });

  if (activeCall) {
    // Record busy attempt
    await prisma.callSession.create({
      data: {
        appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        callType,
        status: 'BUSY',
        roomId: `call_apt_${appointmentId}_busy_${Date.now()}`,
      },
    });

    const error = new Error('Participant is currently engaged in another active call session');
    error.statusCode = 409;
    error.code = 'BUSY_STATE';
    throw error;
  }

  // 3. Generate unique room ID per session
  const roomId = `call_apt_${appointmentId}_${Date.now()}`;

  // 4. Create CallSession record in DB
  const callSession = await prisma.callSession.create({
    data: {
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      callType,
      status: 'INITIATED',
      roomId,
    },
    include: {
      patient: {
        select: { id: true, name: true, email: true },
      },
      doctor: {
        select: { id: true, name: true, email: true, specialization: true },
      },
      appointment: {
        select: { id: true, appointmentDate: true, notes: true },
      },
    },
  });

  return {
    callSession,
    callerRole: isPatient ? 'PATIENT' : 'DOCTOR',
    targetUserId,
    iceServers: getIceServersConfig(),
  };
};

/**
 * Get user-scoped call history
 */
const getUserCallHistory = async (user, { status, callType, page = 1, limit = 10 }) => {
  const whereClause = {};

  if (status) {
    whereClause.status = status;
  }

  if (callType) {
    whereClause.callType = callType;
  }

  if (user.role === 'PATIENT') {
    whereClause.patientId = user.id;
  } else if (user.role === 'DOCTOR') {
    whereClause.doctorId = user.id;
  }

  const skip = (page - 1) * limit;

  const [calls, total] = await Promise.all([
    prisma.callSession.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, name: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, email: true, specialization: true },
        },
        appointment: {
          select: { id: true, appointmentDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.callSession.count({ where: whereClause }),
  ]);

  return {
    calls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get details for a single call session
 */
const getCallSessionById = async (callId, user) => {
  const callSession = await prisma.callSession.findUnique({
    where: { id: callId },
    include: {
      patient: {
        select: { id: true, name: true, email: true },
      },
      doctor: {
        select: { id: true, name: true, email: true, specialization: true },
      },
      appointment: {
        select: { id: true, appointmentDate: true, notes: true },
      },
    },
  });

  if (!callSession) {
    const error = new Error('Call session not found');
    error.statusCode = 404;
    error.code = 'CALL_NOT_FOUND';
    throw error;
  }

  if (
    user.role !== 'ADMIN' &&
    callSession.patientId !== user.id &&
    callSession.doctorId !== user.id
  ) {
    const error = new Error('You are not authorized to view this call session');
    error.statusCode = 403;
    error.code = 'FORBIDDEN_CALL_ACCESS';
    throw error;
  }

  return callSession;
};

/**
 * End an ongoing or active call session via REST
 */
const endCallSession = async (callId, userId) => {
  const callSession = await prisma.callSession.findUnique({
    where: { id: callId },
  });

  if (!callSession) {
    const error = new Error('Call session not found');
    error.statusCode = 404;
    error.code = 'CALL_NOT_FOUND';
    throw error;
  }

  if (callSession.patientId !== userId && callSession.doctorId !== userId) {
    const error = new Error('You are not a participant in this call session');
    error.statusCode = 403;
    error.code = 'FORBIDDEN_CALL_END';
    throw error;
  }

  const endTime = new Date();
  let duration = 0;

  if (callSession.startTime) {
    duration = Math.max(0, Math.floor((endTime.getTime() - new Date(callSession.startTime).getTime()) / 1000));
  }

  const updatedSession = await prisma.callSession.update({
    where: { id: callId },
    data: {
      status: 'COMPLETED',
      endTime,
      duration,
    },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return updatedSession;
};

module.exports = {
  initiateCallSession,
  getUserCallHistory,
  getCallSessionById,
  endCallSession,
  getIceServersConfig,
};
