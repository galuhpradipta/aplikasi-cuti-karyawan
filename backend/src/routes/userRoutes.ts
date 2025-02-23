import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

export default router;
