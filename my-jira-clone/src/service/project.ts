import { PROJECT_API } from '../helper/api';
import type { UserDto } from './auth';
export interface ProjectDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  teamId: number;
  status?: string;
  startDate?: string;
  dueDate?: string;
  createdBy?: number;
  createedName?: string;
  createdAt?: string;
  teamName?: string;
  departmentName?: string;
  isCompleted?: boolean;
  completedAt?: string;
  requiresEvaluation?: boolean;
}
export interface PagedResult<T> {
  Items?: T[];
  items?: T[];
  TotalCount?: number;
  totalCount?: number;
  Page?: number;
  page?: number;
  PageSize?: number;
  pageSize?: number;
  TotalPages?: number;
  totalPages?: number;
  HasPreviousPage?: boolean;
  hasPreviousPage?: boolean;
  HasNextPage?: boolean;
  hasNextPage?: boolean;
}
export interface CreateProjectRequest {
  code: string;
  name: string;
  description?: string;
  teamId: number;
  memberIds?: number[];
  departmentId?: number;
}
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  teamId?: number;
  startDate?: string;
  dueDate?: string;
}
export const ProjectService = {
  getAll: async (keyword?: string): Promise<ProjectDto[]> => {
    const response = await PROJECT_API.getAll(keyword);
    // API helper already extracts data, but handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    if (response && typeof response === 'object') {
      if ('data' in response && Array.isArray(response.data)) {
        return response.data;
      }
      if ('items' in response && Array.isArray(response.items)) {
        return response.items;
      }
      if ('Items' in response && Array.isArray(response.Items)) {
        return response.Items;
      }
    }
    return [];
  },
  getAllPaged: (keyword?: string, page: number = 1, pageSize: number = 10): Promise<PagedResult<ProjectDto>> => {
    return PROJECT_API.getAllPaged(keyword, page, pageSize);
  },
  getById: (id: number): Promise<ProjectDto> => {
    return PROJECT_API.getById(id);
  },
  getMyProjects: (): Promise<ProjectDto[]> => {
    return PROJECT_API.getMyProjects();
  },
  create: (data: CreateProjectRequest): Promise<void> => {
    return PROJECT_API.create(data);
  },
  update: (id: number, data: UpdateProjectRequest): Promise<void> => {
    return PROJECT_API.update(id, data);
  },
  delete: (id: number): Promise<void> => {
    return PROJECT_API.delete(id);
  },
  complete: (id: number): Promise<void> => {
    return PROJECT_API.complete(id);
  },
  reopen: (id: number): Promise<void> => {
    return PROJECT_API.reopen(id);
  },
  getMembers: (id: number): Promise<UserDto[]> => {
    return PROJECT_API.getMembers(id);
  },
  addMember: (id: number, userId: number): Promise<void> => {
    return PROJECT_API.addMember(id, userId);
  },
  removeMember: (id: number, userId: number): Promise<void> => {
    return PROJECT_API.removeMember(id, userId);
  },
  grantKeyMain: (id: number, userId: number): Promise<void> => {
    return PROJECT_API.grantKeyMain(id, userId);
  },
  revokeKeyMain: (id: number, userId: number): Promise<void> => {
    return PROJECT_API.revokeKeyMain(id, userId);
  },
};