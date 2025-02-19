import express from 'express';
import { getPendingApprovals, handleApproval } from '../controllers/approvalController.js';
import { authenticateToken, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get pending approvals for the current user
router.get('/pending', hasRole(['Kepala Divisi', 'HRD', 'Direktur']), getPendingApprovals);

// Handle approval decision
router.put('/:approvalId', hasRole(['Kepala Divisi', 'HRD', 'Direktur']), handleApproval);

export default router; 