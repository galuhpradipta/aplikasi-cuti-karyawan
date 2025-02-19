import api from "./api";
import { ApprovalStatus, RoleType } from "../types/approval";

export interface Approval {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approvalOrder: number;
  status: ApprovalStatus;
  remarks?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  approver: {
    id: number;
    name: string;
    role: {
      id: number;
      name: RoleType;
    };
  };
  leaveRequest: {
    id: number;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    approvals: Array<{
      id: number;
      status: ApprovalStatus;
      approver: {
        id: number;
        name: string;
        role: {
          id: number;
          name: RoleType;
        };
      };
    }>;
    user: {
      id: number;
      name: string;
      email: string;
      nik: string;
    };
    leaveType: {
      id: number;
      name: string;
      description?: string;
    };
  };
}

export const approvalService = {
  async getPendingApprovals(): Promise<Approval[]> {
    const { data } = await api.get<Approval[]>("/approvals/pending");
    return data;
  },

  async handleApproval(
    approvalId: number,
    status: "APPROVED" | "REJECTED",
    leaveRequestId: number,
    remarks?: string
  ): Promise<Approval> {
    const { data } = await api.put<Approval>(`/approvals/${approvalId}`, {
      status,
      remarks,
      leaveRequestId,
    });
    return data;
  },
};
