import express from "express";
import { register, login, getRoles } from "../controllers/authController.js";

const router = express.Router();

// Get roles route (place it before other routes to avoid conflicts)
router.get("/roles", getRoles);

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

export default router;
