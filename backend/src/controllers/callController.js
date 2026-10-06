const callService = require('../services/callService');
const { initiateCallSchema, getCallHistoryQuerySchema } = require('../validators/callValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * Initiate a call POST /api/calls
 */
const initiate = async (req, res, next) => {
  try {
    const validatedData = initiateCallSchema.parse(req.body);
    const result = await callService.initiateCallSession({
      appointmentId: validatedData.appointmentId,
      callType: validatedData.callType,
      callerId: req.user.id,
    });
    return successResponse(res, 'Call session initiated successfully', result, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * End a call session POST /api/calls/:id/end
 */
const end = async (req, res, next) => {
  try {
    const callSession = await callService.endCallSession(req.params.id, req.user.id);
    return successResponse(res, 'Call session ended successfully', { callSession }, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * List user call history GET /api/calls/history or GET /api/calls
 */
const listHistory = async (req, res, next) => {
  try {
    const queryFilters = getCallHistoryQuerySchema.parse(req.query);
    const result = await callService.getUserCallHistory(req.user, queryFilters);
    return successResponse(res, 'Call history retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get call session details GET /api/calls/:id
 */
const getById = async (req, res, next) => {
  try {
    const callSession = await callService.getCallSessionById(req.params.id, req.user);
    return successResponse(res, 'Call details retrieved successfully', { callSession }, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get ICE servers configuration GET /api/calls/ice-servers
 */
const getIceServers = async (req, res, next) => {
  try {
    const iceServers = callService.getIceServersConfig();

    return successResponse(
      res,
      'ICE servers retrieved successfully',
      { iceServers },
      200
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  initiate,
  end,
  listHistory,
  getById,
  getIceServers,
};
