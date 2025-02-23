import express, { Router, Request, Response, NextFunction } from "express";
import {
  createLeaveRequest,
  getUserLeaveRequests,
  getLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getStats,
} from "../controllers/leaveRequestController";
import { authenticateToken } from "../middleware/authMiddleware";
import { AuthenticatedRequest } from "../types/express";

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard stats
router.get("/stats", (req: Request, res: Response, next: NextFunction) => {
  return getStats(req as AuthenticatedRequest, res).catch(next);
});

// Create a new leave request
router.post("/", (req: Request, res: Response, next: NextFunction) => {
  return createLeaveRequest(req as AuthenticatedRequest, res).catch(next);
});

// Get all leave requests for the authenticated user
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  return getUserLeaveRequests(req as AuthenticatedRequest, res).catch(next);
});

// Get a specific leave request
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  return getLeaveRequest(req as AuthenticatedRequest, res).catch(next);
});

// Update a leave request
router.put("/:id", (req: Request, res: Response, next: NextFunction) => {
  return updateLeaveRequest(req as AuthenticatedRequest, res).catch(next);
});

// Delete a leave request
router.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
  return deleteLeaveRequest(req as AuthenticatedRequest, res).catch(next);
});

export default router;
