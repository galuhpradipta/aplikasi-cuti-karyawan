import api from "./api";

export interface LeaveType {
  id: number;
  name: string;
  description: string | null;
  maxDays: number | null;
}

const leaveTypeService = {
  // Get all leave types
  getAll: async (): Promise<LeaveType[]> => {
    const response = await api.get<LeaveType[]>("/leave-types");
    return response.data;
  },
};

export default leaveTypeService;
