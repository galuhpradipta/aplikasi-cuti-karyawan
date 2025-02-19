import api from "./api";
import { LeaveType } from "./leaveTypeService";

export interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
  leaveType: LeaveType;
  approvals: Array<{
    id: number;
    status: string;
    approvalOrder: number;
    approvedAt: string | null;
    remarks: string | null;
    approver: {
      name: string;
      role: {
        name: string;
      };
    };
  }>;
}

export interface CreateLeaveRequestData {
  startDate: string;
  endDate: string;
  reason: string;
  leaveTypeId: number;
}

export interface UpdateLeaveRequestData {
  startDate: string;
  endDate: string;
  reason: string;
  leaveTypeId: number;
}

const leaveRequestService = {
  // Create a new leave request
  create: async (data: CreateLeaveRequestData): Promise<LeaveRequest> => {
    const response = await api.post<LeaveRequest>("/leave-requests", data);
    return response.data;
  },

  // Get all leave requests for the authenticated user
  getAll: async (): Promise<LeaveRequest[]> => {
    const response = await api.get<LeaveRequest[]>("/leave-requests");
    return response.data;
  },

  // Get a specific leave request
  get: async (id: number): Promise<LeaveRequest> => {
    const response = await api.get<LeaveRequest>(`/leave-requests/${id}`);
    return response.data;
  },

  // Update a leave request
  update: async (
    id: number,
    data: UpdateLeaveRequestData
  ): Promise<LeaveRequest> => {
    const response = await api.put<LeaveRequest>(`/leave-requests/${id}`, data);
    return response.data;
  },

  // Delete a leave request
  delete: async (id: number): Promise<void> => {
    await api.delete(`/leave-requests/${id}`);
  },
};

export default leaveRequestService;
