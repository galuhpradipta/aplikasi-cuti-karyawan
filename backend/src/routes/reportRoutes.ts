import express from "express";
import {
  getLeaveRequestReports,
  exportLeaveRequestsCSV,
} from "../controllers/reportController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Protected routes - require authentication
router.use(authenticateToken);

router.get("/leave-requests", getLeaveRequestReports);
router.get("/leave-requests/export", exportLeaveRequestsCSV);

export default router;
