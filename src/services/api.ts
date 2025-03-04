import axios from "axios";
import { User } from "../types/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  nik: string;
  roleId: number;
  divisionId?: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", credentials);
    localStorage.setItem("token", data.token);
    return data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", userData);
    localStorage.setItem("token", data.token);
    return data;
  },

  logout() {
    localStorage.removeItem("token");
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },
};

export default api;
