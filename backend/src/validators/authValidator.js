const { z } = require('zod');

const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN'], {
    invalid_type_error: 'Role must be PATIENT, DOCTOR, or ADMIN',
  }).default('PATIENT'),
  specialization: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
