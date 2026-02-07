
export interface LoginPayload {
  email: string | null;
  username: string | null;
  password: string;
}
export interface LoginResponse {
  code: number;
  message: string;
  token?: string;
  user?: {
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
  };
  data?: {
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
  };
}