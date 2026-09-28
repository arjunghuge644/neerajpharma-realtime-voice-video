const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment (Patient or Admin)
 * @access  Private (PATIENT, ADMIN)
 */
router.post('/', authenticate, authorizeRole('PATIENT', 'ADMIN'), appointmentController.create);

/**
 * @route   GET /api/appointments
 * @desc    List appointments for authenticated user
 * @access  Private
 */
router.get('/', authenticate, appointmentController.list);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get details of a specific appointment
 * @access  Private (Assigned Patient, Doctor, or Admin)
 */
router.get('/:id', authenticate, appointmentController.getById);

module.exports = router;
