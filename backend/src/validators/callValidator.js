const { z } = require('zod');

const initiateCallSchema = z.object({
  appointmentId: z.string({ required_error: 'Appointment ID is required' }).min(1, 'Appointment ID is required'),
  callType: z.enum(['VOICE', 'VIDEO'], {
    invalid_type_error: 'Call type must be VOICE or VIDEO',
  }).default('VIDEO'),
});

const endCallSchema = z.object({
  callSessionId: z.string().optional(),
});

const getCallHistoryQuerySchema = z.object({
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
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});

module.exports = {
  initiateCallSchema,
  endCallSchema,
  getCallHistoryQuerySchema,
};
