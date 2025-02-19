export type Role = 'karyawan' | 'kepala_divisi' | 'hrd' | 'direktur';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  division?: string; // For employees and division heads
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved_division' | 'approved_hrd' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistory {
  id: string;
  leaveRequestId: string;
  approverId: string;
  status: 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
}