const prisma = require('../config/prisma');

/**
 * Get aggregated system call statistics for Admin Dashboard
 */
const getCallStatistics = async () => {
  const [
    totalCalls,
    activeCalls,
    completedCalls,
    rejectedCalls,
    missedCalls,
    busyCalls,
    failedCalls,
    voiceCalls,
    videoCalls,
    completedDurations,
  ] = await Promise.all([
    prisma.callSession.count(),
    prisma.callSession.count({
      where: { status: { in: ['INITIATED', 'RINGING', 'ACCEPTED', 'CONNECTED', 'ONGOING'] } },
    }),
    prisma.callSession.count({ where: { status: 'COMPLETED' } }),
    prisma.callSession.count({ where: { status: 'REJECTED' } }),
    prisma.callSession.count({ where: { status: 'MISSED' } }),
    prisma.callSession.count({ where: { status: 'BUSY' } }),
    prisma.callSession.count({ where: { status: 'FAILED' } }),
    prisma.callSession.count({ where: { callType: 'VOICE' } }),
    prisma.callSession.count({ where: { callType: 'VIDEO' } }),
    prisma.callSession.findMany({
      where: { status: 'COMPLETED', duration: { not: null } },
      select: { duration: true },
    }),
  ]);

  const completionRate = totalCalls > 0 ? parseFloat(((completedCalls / totalCalls) * 100).toFixed(1)) : 0;

  const totalSeconds = completedDurations.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const averageDurationSeconds = completedDurations.length > 0 ? Math.round(totalSeconds / completedDurations.length) : 0;

  return {
    totalCalls,
    activeCalls,
    completedCalls,
    rejectedCalls,
    missedCalls,
    busyCalls,
    failedCalls,
    completionRatePercent: completionRate,
    callTypeBreakdown: {
      VOICE: voiceCalls,
      VIDEO: videoCalls,
    },
    averageDurationSeconds,
  };
};

/**
 * Get real-time active / ongoing call sessions list
 */
const getActiveCalls = async () => {
  const activeSessions = await prisma.callSession.findMany({
    where: {
      status: {
        in: ['INITIATED', 'RINGING', 'ACCEPTED', 'CONNECTED', 'ONGOING'],
      },
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
    orderBy: { createdAt: 'desc' },
  });

  return activeSessions;
};

/**
 * Get system-wide complete call history with pagination & multi-field filters
 */
const getSystemCallHistory = async ({
  status,
  callType,
  patientId,
  doctorId,
  startDate,
  endDate,
  page = 1,
  limit = 10,
}) => {
  const whereClause = {};

  if (status) whereClause.status = status;
  if (callType) whereClause.callType = callType;
  if (patientId) whereClause.patientId = patientId;
  if (doctorId) whereClause.doctorId = doctorId;

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
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
          select: { id: true, appointmentDate: true, notes: true },
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
 * Get detailed inspection for a single call session
 */
const getCallDetails = async (callId) => {
  const callSession = await prisma.callSession.findUnique({
    where: { id: callId },
    include: {
      patient: {
        select: { id: true, name: true, email: true, role: true },
      },
      doctor: {
        select: { id: true, name: true, email: true, role: true, specialization: true },
      },
      appointment: {
        select: { id: true, appointmentDate: true, status: true, notes: true, createdAt: true },
      },
    },
  });

  if (!callSession) {
    const error = new Error('Call session record not found');
    error.statusCode = 404;
    error.code = 'CALL_NOT_FOUND';
    throw error;
  }

  return callSession;
};

module.exports = {
  getCallStatistics,
  getActiveCalls,
  getSystemCallHistory,
  getCallDetails,
};
