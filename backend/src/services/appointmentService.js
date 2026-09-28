const prisma = require('../config/prisma');

/**
 * Create a new appointment between a Patient and a Doctor
 */
const createAppointment = async ({ patientId, doctorId, appointmentDate, notes }) => {
  // 1. Verify doctor exists and has role DOCTOR
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
  });

  if (!doctor || doctor.role !== 'DOCTOR') {
    const error = new Error('Target doctor not found or invalid doctor account');
    error.statusCode = 400;
    error.code = 'INVALID_DOCTOR';
    throw error;
  }

  // 2. Create appointment in DB
  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      status: 'SCHEDULED',
      notes: notes || null,
    },
    include: {
      patient: {
        select: { id: true, name: true, email: true },
      },
      doctor: {
        select: { id: true, name: true, email: true, specialization: true },
      },
    },
  });

  return appointment;
};

/**
 * Get appointments associated with requesting user (or all if ADMIN)
 */
const getUserAppointments = async (user, { status, page = 1, limit = 10 }) => {
  const whereClause = {};

  if (status) {
    whereClause.status = status;
  }

  if (user.role === 'PATIENT') {
    whereClause.patientId = user.id;
  } else if (user.role === 'DOCTOR') {
    whereClause.doctorId = user.id;
  }

  const skip = (page - 1) * limit;

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, name: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, email: true, specialization: true },
        },
      },
      orderBy: { appointmentDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.appointment.count({ where: whereClause }),
  ]);

  return {
    appointments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single appointment by ID with role check
 */
const getAppointmentById = async (appointmentId, user) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        select: { id: true, name: true, email: true },
      },
      doctor: {
        select: { id: true, name: true, email: true, specialization: true },
      },
      calls: {
        select: {
          id: true,
          callType: true,
          status: true,
          startTime: true,
          endTime: true,
          duration: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    error.code = 'APPOINTMENT_NOT_FOUND';
    throw error;
  }

  // Authorization check: User must be Patient, Doctor, or Admin
  if (
    user.role !== 'ADMIN' &&
    appointment.patientId !== user.id &&
    appointment.doctorId !== user.id
  ) {
    const error = new Error('You are not authorized to view this appointment');
    error.statusCode = 403;
    error.code = 'FORBIDDEN_APPOINTMENT_ACCESS';
    throw error;
  }

  return appointment;
};

/**
 * Validate appointment gating for call initiation/joining
 */
const validateAppointmentForCall = async (appointmentId, userId) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    error.code = 'APPOINTMENT_NOT_FOUND';
    throw error;
  }

  if (appointment.status === 'CANCELLED') {
    const error = new Error('Cannot initiate call for a cancelled appointment');
    error.statusCode = 400;
    error.code = 'APPOINTMENT_CANCELLED';
    throw error;
  }

  const isPatient = appointment.patientId === userId;
  const isDoctor = appointment.doctorId === userId;

  if (!isPatient && !isDoctor) {
    const error = new Error('Unauthorized call attempt. You are not a participant in this appointment');
    error.statusCode = 403;
    error.code = 'FORBIDDEN_CALL_ATTEMPT';
    throw error;
  }

  return {
    appointment,
    isPatient,
    isDoctor,
    targetUserId: isPatient ? appointment.doctorId : appointment.patientId,
  };
};

module.exports = {
  createAppointment,
  getUserAppointments,
  getAppointmentById,
  validateAppointmentForCall,
};
