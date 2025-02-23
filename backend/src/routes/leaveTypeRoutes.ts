import express from "express";
import { getAllLeaveTypes } from "../controllers/leaveTypeController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all leave types
router.get("/", getAllLeaveTypes);

export default router;
