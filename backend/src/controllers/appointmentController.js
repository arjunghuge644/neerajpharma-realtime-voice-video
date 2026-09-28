const appointmentService = require('../services/appointmentService');
const { createAppointmentSchema, getAppointmentsQuerySchema } = require('../validators/appointmentValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * Create new appointment POST /api/appointments
 */
const create = async (req, res, next) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body);
    const appointment = await appointmentService.createAppointment({
      patientId: req.user.id,
      ...validatedData,
    });
    return successResponse(res, 'Appointment created successfully', { appointment }, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user appointments GET /api/appointments
 */
const list = async (req, res, next) => {
  try {
    const queryFilters = getAppointmentsQuerySchema.parse(req.query);
    const result = await appointmentService.getUserAppointments(req.user, queryFilters);
    return successResponse(res, 'Appointments retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single appointment details GET /api/appointments/:id
 */
const getById = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);
    return successResponse(res, 'Appointment details retrieved successfully', { appointment }, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  create,
  list,
  getById,
};
