import axios from "axios";
import { LeaveRequest } from "../types/leaveRequest";
import { getAuthToken } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const reportService = {
  getLeaveRequestReports: async (filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    userId?: number;
  }): Promise<LeaveRequest[]> => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/api/reports/leave-requests`, {
      params: filters,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  exportLeaveRequestsCSV: async (filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    userId?: number;
  }): Promise<void> => {
    const token = getAuthToken();
    const response = await axios.get(
      `${API_URL}/api/reports/leave-requests/export`,
      {
        params: filters,
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `leave-requests-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
