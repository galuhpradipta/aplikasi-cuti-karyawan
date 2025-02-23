import express from "express";
import {
  register,
  login,
  getRoles,
  getDivisions,
} from "../controllers/authController.js";

const router = express.Router();

// Get roles route (place it before other routes to avoid conflicts)
router.get("/roles", getRoles);

// Get divisions route
router.get("/divisions", getDivisions);

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

export default router;
