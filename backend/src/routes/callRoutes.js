const express = require('express');
const callController = require('../controllers/callController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/calls
 * @desc    Initiate a new Voice or Video call session
 * @access  Private (PATIENT, DOCTOR)
 */
router.post('/', authenticate, authorizeRole('PATIENT', 'DOCTOR'), callController.initiate);

/**
 * @route   GET /api/calls/history
 * @desc    Get user-scoped call history
 * @access  Private
 */
router.get('/history', authenticate, callController.listHistory);

/**
 * @route   GET /api/calls
 * @desc    Get user-scoped call history (Alias)
 * @access  Private
 */
router.get('/', authenticate, callController.listHistory);

/**
 * @route   POST /api/calls/:id/end
 * @desc    End an ongoing call session via REST
 * @access  Private (Assigned Participants)
 */
router.post('/:id/end', authenticate, callController.end);

/**
 * @route   GET /api/calls/:id
 * @desc    Get details of a specific call session
 * @access  Private (Assigned Participants or Admin)
 */
router.get('/:id', authenticate, callController.getById);

module.exports = router;
