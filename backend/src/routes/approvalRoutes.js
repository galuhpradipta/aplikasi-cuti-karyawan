import express from 'express';
import { getPendingApprovals, handleApproval } from '../controllers/approvalController.js';
import { authenticateToken, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get pending approvals for the current user
router.get('/pending', hasRole(['Kepala Divisi']), getPendingApprovals);

// Handle approval decision
router.put('/:id', hasRole(['Kepala Divisi']), handleApproval);

export default router; 