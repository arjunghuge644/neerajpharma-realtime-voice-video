const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * Handle user registration POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.registerUser(validatedData);
    return successResponse(res, 'User registered successfully', result, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Handle user login POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedData);
    return successResponse(res, 'Login successful', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Handle current user profile retrieval GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    return successResponse(res, 'User profile retrieved successfully', { user }, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
