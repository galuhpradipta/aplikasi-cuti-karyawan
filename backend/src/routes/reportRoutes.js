import express from 'express';
import { getLeaveRequestReports, exportLeaveRequestsCSV } from '../controllers/reportController.js';
import { authenticateToken, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Only HRD and Direktur can access reports
router.use(hasRole(['HRD', 'Direktur']));

// Get leave request reports
router.get('/leave-requests', getLeaveRequestReports);

// Export leave requests to CSV
router.get('/leave-requests/export', exportLeaveRequestsCSV);

export default router; 