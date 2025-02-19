import express from 'express';
import {
    createLeaveRequest,
    getUserLeaveRequests,
    getLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
} from '../controllers/leaveRequestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new leave request
router.post('/', createLeaveRequest);

// Get all leave requests for the authenticated user
router.get('/', getUserLeaveRequests);

// Get a specific leave request
router.get('/:id', getLeaveRequest);

// Update a leave request
router.put('/:id', updateLeaveRequest);

// Delete a leave request
router.delete('/:id', deleteLeaveRequest);

export default router; 