import express, { Request, Response, ErrorRequestHandler } from "express";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import leaveRequestRoutes from "./routes/leaveRequestRoutes";
import leaveTypeRoutes from "./routes/leaveTypeRoutes";
import approvalRoutes from "./routes/approvalRoutes";
import userRoutes from "./routes/userRoutes";
import app from "./app";

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.APP_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/users", userRoutes);

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

interface CustomError extends Error {
  status?: number;
}

// Error handling middleware
const errorHandler: ErrorRequestHandler = (
  err: CustomError,
  _req: Request,
  res: Response
): void => {
  console.error("Error:", err);

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      message: "Invalid JSON payload",
      error: err.message,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(400).json({
      message: "Database operation failed",
      error: err.message,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      message: "Invalid data provided",
      error: err.message,
    });
    return;
  }

  res.status(err.status || 500).json({
    message: err.message || "Terjadi kesalahan pada server",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // Test database connection
    await prisma.$connect();
    console.log("Database connection established");

    // Create default roles if they don't exist
    const roles = ["Karyawan", "Kepala Divisi", "HRD", "Direktur"];
    for (const roleName of roles) {
      await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });
    }
    console.log("Default roles created");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
});
