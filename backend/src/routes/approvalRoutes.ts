import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getPendingApprovals,
  handleApproval,
} from "../controllers/approvalController";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get pending approvals for the current user
router.get("/pending", getPendingApprovals);

// Handle approval (approve/reject)
router.put("/:id", handleApproval);

export default router;
