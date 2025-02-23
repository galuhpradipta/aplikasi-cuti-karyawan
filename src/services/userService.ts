import api from "./api";
import { User, Role, Division } from "../types/shared";

export interface UserResponse {
  users: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  nik?: string;
  roleId?: number;
  divisionId?: number | null;
}

const userService = {
  async getUsers(
    page: number,
    limit: number,
    search?: string
  ): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>("/users", {
      params: {
        page,
        limit,
        search,
      },
    });
    return data;
  },

  async updateUser(id: number, userData: UserUpdateData): Promise<User> {
    const { data } = await api.put<User>(`/users/${id}`, userData);
    return data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getRoles(): Promise<Role[]> {
    const { data } = await api.get<Role[]>("/auth/roles");
    return data;
  },

  async getDivisions(): Promise<Division[]> {
    const { data } = await api.get<Division[]>("/auth/divisions");
    return data;
  },
};

export default userService;
