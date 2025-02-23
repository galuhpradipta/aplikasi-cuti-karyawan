import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import leaveRequestRoutes from "./routes/leaveRequestRoutes";
import approvalRoutes from "./routes/approvalRoutes";
import leaveTypeRoutes from "./routes/leaveTypeRoutes";
import userRoutes from "./routes/userRoutes";
import reportRoutes from "./routes/reportRoutes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

// Error handling middleware
const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
};

app.use(errorHandler);

export default app;
