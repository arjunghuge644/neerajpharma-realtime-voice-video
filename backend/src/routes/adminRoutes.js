const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply Authentication & Strict ADMIN Role Authorization to all routes in this router
router.use(authenticate, authorizeRole('ADMIN'));

/**
 * @route   GET /api/admin/calls/stats
 * @desc    Get aggregate system call statistics
 * @access  Private (ADMIN)
 */
router.get('/stats', adminController.getStats);

/**
 * @route   GET /api/admin/calls/active
 * @desc    Get real-time list of active/ongoing call sessions
 * @access  Private (ADMIN)
 */
router.get('/active', adminController.getActive);

/**
 * @route   GET /api/admin/calls
 * @desc    Get system-wide call history with pagination & multi-field filters
 * @access  Private (ADMIN)
 */
router.get('/', adminController.getHistory);

/**
 * @route   GET /api/admin/calls/:id
 * @desc    Get detailed session inspection for a specific call record
 * @access  Private (ADMIN)
 */
router.get('/:id', adminController.getById);

module.exports = router;
