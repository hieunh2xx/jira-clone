import { DEPARTMENT_API } from '../helper/api';
export interface DepartmentDto {
  id: number;
  name: string;
  code?: string;
  managerId?: number;
  managerName?: string;
  description?: string;
  createdAt?: string;
  totalUsers: number;
  totalTeams: number;
}
export interface CreateDepartmentRequest {
  name: string;
  code?: string;
  managerId?: number;
  description?: string;
}
export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  managerId?: number;
  description?: string;
}
export interface RoleHierarchyDto {
  id: number;
  name: string;
  level: number;
  description?: string;
  isAssignedToDepartment: boolean;
}
export interface AssignRoleToDepartmentRequest {
  departmentId: number;
  roleIds: number[];
}
export const DepartmentService = {
  getAll: (): Promise<DepartmentDto[]> => {
    return DEPARTMENT_API.getAll();
  },
  getById: (id: number): Promise<DepartmentDto> => {
    return DEPARTMENT_API.getById(id);
  },
  create: (data: CreateDepartmentRequest): Promise<DepartmentDto> => {
    return DEPARTMENT_API.create(data);
  },
  update: (id: number, data: UpdateDepartmentRequest): Promise<DepartmentDto> => {
    return DEPARTMENT_API.update(id, data);
  },
  delete: (id: number): Promise<void> => {
    return DEPARTMENT_API.delete(id);
  },
  getRoles: (id: number): Promise<RoleHierarchyDto[]> => {
    return DEPARTMENT_API.getRoles(id);
  },
  assignRoles: (id: number, data: AssignRoleToDepartmentRequest): Promise<void> => {
    return DEPARTMENT_API.assignRoles(id, data);
  },
};