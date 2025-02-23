import express, { RequestHandler } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getUsers,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get users with pagination and search
router.get("/", getUsers as RequestHandler);

// Update user
router.put("/:id", updateUser as RequestHandler);

// Delete user
router.delete("/:id", deleteUser as RequestHandler);

export default router;
