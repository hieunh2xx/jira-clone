import { AUTH_API } from '../helper/api';
import { LoginPayload, LoginResponse } from '../interface/loginInterface';
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
  departmentId?: number;
}
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  departmentId?: number;
  departmentName?: string;
}
export interface UserDto {
  id: number;
  employeeCode: string;
  username: string;
  email: string;
  fullName: string;
  departmentId: number | null;
  departmentName: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roleId: number[];
  roleName: string[];
  teamIds: number[];
  projectRole?: string | null; // Role in project: "keymain", "member", etc.
}
export const AuthService = {
  login: (data: LoginPayload): Promise<LoginResponse> => {
    return AUTH_API.login(data);
  },
  register: (data: RegisterRequest): Promise<any> => {
    return AUTH_API.register(data);
  },
  getAllUsers: (): Promise<any> => {
    return AUTH_API.getAllUsers();
  },
  searchUsers: (keyword: string): Promise<UserDto[]> => {
    return AUTH_API.searchUsers(keyword);
  },
  getUser: (id: number): Promise<any> => {
    return AUTH_API.getUser(id);
  },
  updateUser: (id: number, data: UpdateUserRequest): Promise<any> => {
    return AUTH_API.updateUser(id, data);
  },
  deleteUser: (id: number): Promise<any> => {
    return AUTH_API.deleteUser(id);
  },
};