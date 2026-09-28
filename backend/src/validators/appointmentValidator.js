const { z } = require('zod');

const createAppointmentSchema = z.object({
  doctorId: z.string({ required_error: 'Doctor ID is required' }).min(1, 'Doctor ID is required'),
  appointmentDate: z.string({ required_error: 'Appointment date is required' }).refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid ISO date timestamp format' }
  ),
  notes: z.string().optional(),
});

const getAppointmentsQuerySchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});

module.exports = {
  createAppointmentSchema,
  getAppointmentsQuerySchema,
};
