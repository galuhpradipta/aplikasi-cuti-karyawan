import axios from "axios";
import { getAuthToken } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface User {
  id: number;
  nik: string;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  users: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserUpdateData {
  name: string;
  email: string;
  nik: string;
  roleId: number;
  password?: string;
}

const userService = {
  getUsers: async (
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ): Promise<UserResponse> => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/api/users`, {
      params: { page, limit, search },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateUser: async (id: number, userData: UserUpdateData): Promise<User> => {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/api/users/${id}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    const token = getAuthToken();
    await axios.delete(`${API_URL}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default userService;
