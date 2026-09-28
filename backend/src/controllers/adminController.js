const adminService = require('../services/adminService');
const { getAdminCallsQuerySchema } = require('../validators/adminValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * Get aggregate call statistics GET /api/admin/calls/stats
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getCallStatistics();
    return successResponse(res, 'Admin call statistics retrieved successfully', stats, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get active / ongoing calls GET /api/admin/calls/active
 */
const getActive = async (req, res, next) => {
  try {
    const activeCalls = await adminService.getActiveCalls();
    return successResponse(res, 'Active calls retrieved successfully', { activeCalls, count: activeCalls.length }, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get system-wide call history GET /api/admin/calls
 */
const getHistory = async (req, res, next) => {
  try {
    const queryFilters = getAdminCallsQuerySchema.parse(req.query);
    const result = await adminService.getSystemCallHistory(queryFilters);
    return successResponse(res, 'System call history retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get call session details GET /api/admin/calls/:id
 */
const getById = async (req, res, next) => {
  try {
    const callSession = await adminService.getCallDetails(req.params.id);
    return successResponse(res, 'Call session details retrieved successfully', { callSession }, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStats,
  getActive,
  getHistory,
  getById,
};
