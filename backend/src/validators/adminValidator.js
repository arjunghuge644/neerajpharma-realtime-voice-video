const { z } = require('zod');

const getAdminCallsQuerySchema = z.object({
  status: z.enum([
    'INITIATED',
    'RINGING',
    'ACCEPTED',
    'ONGOING',
    'COMPLETED',
    'REJECTED',
    'MISSED',
    'FAILED',
    'BUSY',
  ]).optional(),
  callType: z.enum(['VOICE', 'VIDEO']).optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  startDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid ISO startDate format' }
  ),
  endDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid ISO endDate format' }
  ),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});

module.exports = {
  getAdminCallsQuerySchema,
};
