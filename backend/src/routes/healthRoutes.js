const express = require('express');
const { successResponse } = require('../utils/apiResponse');
const config = require('../config/env');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  return successResponse(res, 'NeerajPharma API Backend Service is healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

module.exports = router;
