import api from "./api";

export interface Approval {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approvalOrder: number;
  status: string;
  remarks?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  leaveRequest: {
    id: number;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
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
    id: number,
    status: "APPROVED" | "REJECTED",
    remarks?: string
  ): Promise<Approval> {
    const { data } = await api.put<Approval>(`/approvals/${id}`, {
      status,
      remarks,
    });
    return data;
  },
};
