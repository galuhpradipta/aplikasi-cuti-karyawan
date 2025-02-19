import { User } from "./user";
import { LeaveType } from "./leaveType";
import { Approval } from "./approval";

export interface LeaveRequest {
  id: number;
  userId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  user: User;
  leaveType: LeaveType;
  approvals: Approval[];
}
