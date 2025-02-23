import { Request } from "express";
import { Role } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    roleId: number;
    role: Role;
  };
}

export interface RequestWithUser extends Request {
  user?: {
    id: number;
    email: string;
    roleId: number;
    role: Role;
  };
}
