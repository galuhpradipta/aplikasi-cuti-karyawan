import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();

interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    roleId: number;
    role: {
      id: number;
      name: string;
    };
  };
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Authentication token required" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Attach user to request object
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    res.status(500).json({ message: "Error authenticating user" });
  }
};

// Middleware to check if user has required role
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authenticatedReq = req as AuthenticatedRequest;
    if (!authenticatedReq.user || !authenticatedReq.user.role) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!roles.includes(authenticatedReq.user.role.name)) {
      res.status(403).json({ message: "Forbidden - Insufficient permissions" });
      return;
    }

    next();
  };
};
