
import { ENDPOINTS } from '../constants/endpoints';
import { LoginPayload, LoginResponse } from '../interface/loginInterface';
import {
  KanbanBoardDto,
  TaskDto,
  UpdateTaskPositionRequest,
} from '../interface/kanbanInterface';
import { ApiResponse, isApiResponse } from '../interface/apiResponse';
import { handleUnauthorized } from './auth';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface ApiOptions {
  method: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
  responseType?: 'json' | 'blob';
}
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_BASE_URL;
  if (envUrl) return envUrl;
  if (import.meta.env.DEV) {
    return 'http://localhost:5260';
  }
  // Production: Use backend URL with port 5002
  // If frontend is on HTTPS but backend is on HTTP, use the backend URL directly
  return 'http://10.164.65.249:5002';
};
const API_BASE_URL = getApiBaseUrl();
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const api = async <T>(
  endpoint: string,
  { method, body, headers = {}, isFormData = false, responseType = 'json' }: ApiOptions
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = getAuthHeaders();
  const config: RequestInit = {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders,
      ...headers,
    },
  };
  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }
  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (networkError: any) {
    throw new Error(`Network error: ${networkError?.message || 'Không thể kết nối đến server'}`);
  }
  if (response.status === 204) {
    return {} as T;
  }
  
  // Handle blob response
  if (responseType === 'blob') {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        throw new Error('Unauthorized');
      }
      // Try to get error message from response
      try {
        const errorText = await response.text();
        // Try to parse as JSON to get error message
        try {
          const errorJson = JSON.parse(errorText);
          const errorMessage = errorJson?.message || errorJson?.data?.message || errorText || response.statusText || 'Đã có lỗi xảy ra';
          throw new Error(errorMessage);
        } catch {
          // If not JSON, use text as error message
          throw new Error(errorText || response.statusText || 'Đã có lỗi xảy ra');
        }
      } catch (error: any) {
        // If error is already thrown, rethrow it
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(response.statusText || 'Đã có lỗi xảy ra');
      }
    }
    const blob = await response.blob();
    return blob as T;
  }
  
  // Handle JSON response
  let responseData: any;
  try {
    const responseText = await response.text();
    if (responseText.trim() === 'Unauthorized' || responseText.trim().toLowerCase() === 'unauthorized') {
      handleUnauthorized();
      throw new Error('Unauthorized');
    }
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch (error: any) {
    if (response.status === 401 || response.status === 403 || response.statusText === 'Unauthorized') {
      handleUnauthorized();
      throw new Error('Unauthorized');
    }
    throw new Error(response.statusText || 'Đã có lỗi xảy ra');
  }
  if (isApiResponse(responseData) || (responseData && typeof responseData.code === 'number' && typeof responseData.message === 'string')) {
    if (responseData.code !== 200 && responseData.code !== 201) {
      const error = new Error(responseData.message || 'Đã có lỗi xảy ra');
      (error as any).code = responseData.code;
      (error as any).data = responseData.data;
      if (responseData.code === 401 || 
          responseData.code === 403 || 
          responseData.message === 'Unauthorized' ||
          responseData.message?.toLowerCase() === 'unauthorized') {
        handleUnauthorized();
        throw error;
      }
      throw error;
    }
    if ('token' in responseData || 'user' in responseData) {
      return responseData as T;
    }
    if (responseData.data === null || responseData.data === undefined) {
      return responseData as T;
    }
    return responseData.data as T;
  }
  if (!response.ok) {
    const errorMessage = responseData?.message || response.statusText || 'Đã có lỗi xảy ra';
    const error = new Error(errorMessage);
    (error as any).code = response.status;
    (error as any).data = responseData?.data;
    if ((response.status === 401 || response.status === 403) && (!responseData || typeof responseData.code !== 'number')) {
      handleUnauthorized();
    }
    throw error;
  }
  return responseData as T;
};
export const apiClient = {
  get: <T>(endpoint: string, options?: { headers?: Record<string, string>; responseType?: 'json' | 'blob' }) =>
    api<T>(endpoint, { method: 'GET', headers: options?.headers, responseType: options?.responseType || 'json' }),
  post: <T>(
    endpoint: string,
    body: any,
    options?: { isFormData?: boolean; headers?: Record<string, string> }
  ) =>
    api<T>(endpoint, {
      method: 'POST',
      body,
      isFormData: options?.isFormData,
      headers: options?.headers,
    }),
  put: <T>(
    endpoint: string,
    body: any,
    options?: { isFormData?: boolean; headers?: Record<string, string> }
  ) =>
    api<T>(endpoint, {
      method: 'PUT',
      body,
      isFormData: options?.isFormData,
      headers: options?.headers,
    }),
  patch: <T>(
    endpoint: string,
    body: any,
    options?: { isFormData?: boolean; headers?: Record<string, string> }
  ) =>
    api<T>(endpoint, {
      method: 'PATCH',
      body,
      isFormData: options?.isFormData,
      headers: options?.headers,
    }),
  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: 'DELETE', headers }),
};
export const AUTH_API = {
  login: (data: LoginPayload) =>
    apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, data),
  register: (data: any) =>
    apiClient.post<any>(ENDPOINTS.AUTH.REGISTER, data),
  getAllUsers: () =>
    apiClient.get<any>(ENDPOINTS.AUTH.GET_ALL_USERS),
  searchUsers: (keyword: string) =>
    apiClient.get<any>(`${ENDPOINTS.AUTH.SEARCH_USERS}?keyword=${encodeURIComponent(keyword)}`),
  getUser: (id: number) =>
    apiClient.get<any>(ENDPOINTS.AUTH.GET_USER(id)),
  updateUser: (id: number, data: any) =>
    apiClient.put<any>(ENDPOINTS.AUTH.UPDATE_USER(id), data),
  deleteUser: (id: number) =>
    apiClient.delete<any>(ENDPOINTS.AUTH.DELETE_USER(id)),
};
export const PROJECT_API = {
  getAll: (keyword?: string) =>
    apiClient.get<any>(keyword ? `${ENDPOINTS.PROJECT.LIST}?keyword=${keyword}` : ENDPOINTS.PROJECT.LIST),
  getAllPaged: (keyword?: string, page: number = 1, pageSize: number = 10) => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    return apiClient.get<any>(`${ENDPOINTS.PROJECT.LIST}?${params.toString()}`);
  },
  getById: (id: number) =>
    apiClient.get<any>(ENDPOINTS.PROJECT.GET_BY_ID(id)),
  getMyProjects: () =>
    apiClient.get<any>(ENDPOINTS.PROJECT.MY_PROJECTS),
  create: (data: any) =>
    apiClient.post<any>(ENDPOINTS.PROJECT.CREATE, data),
  update: (id: number, data: any) =>
    apiClient.put<any>(ENDPOINTS.PROJECT.UPDATE(id), data),
  delete: (id: number) =>
    apiClient.delete<any>(ENDPOINTS.PROJECT.DELETE(id)),
  complete: (id: number) =>
    apiClient.post<any>(`/api/Project/${id}/complete`, {}),
  reopen: (id: number) =>
    apiClient.post<any>(`/api/Project/${id}/reopen`, {}),
  getMembers: (id: number) =>
    apiClient.get<any>(`/api/Project/${id}/members`),
  addMember: (id: number, userId: number) =>
    apiClient.post<any>(`/api/Project/${id}/members`, { userId }),
  removeMember: (id: number, userId: number) =>
    apiClient.delete<any>(`/api/Project/${id}/members/${userId}`),
  grantKeyMain: (id: number, userId: number) =>
    apiClient.post<any>(`/api/Project/${id}/members/${userId}/grant-keymain`, {}),
  revokeKeyMain: (id: number, userId: number) =>
    apiClient.delete<any>(`/api/Project/${id}/members/${userId}/revoke-keymain`),
};
export const TASK_API = {
  create: (projectId: number, data: FormData) =>
    apiClient.post<any>(ENDPOINTS.TASK.CREATE(projectId), data, { isFormData: true }),
  getDetail: (projectId: number, taskId: number) =>
    apiClient.get<any>(ENDPOINTS.TASK.GET_DETAIL(projectId, taskId)),
  update: (projectId: number, taskId: number, data: FormData) =>
    apiClient.patch<any>(ENDPOINTS.TASK.UPDATE(projectId, taskId), data, { isFormData: true }),
  delete: (projectId: number, taskId: number) =>
    apiClient.delete<any>(ENDPOINTS.TASK.DELETE(projectId, taskId)),
  getKanban: (projectId: number) =>
    apiClient.get<KanbanBoardDto>(ENDPOINTS.TASK.GET_KANBAN(projectId)),
  updateStatus: (projectId: number, taskId: number, status: string, userId: number = 1) =>
    apiClient.patch<any>(ENDPOINTS.TASK.UPDATE_STATUS(projectId, taskId), { status }, { headers: { 'X-User-Id': userId.toString() } }),
};
export const COMMENT_API = {
  create: (projectId: number, issueId: number, data: FormData) =>
    apiClient.post<any>(ENDPOINTS.COMMENT.CREATE(projectId, issueId), data, { isFormData: true }),
  getAll: (projectId: number, issueId: number) =>
    apiClient.get<any>(ENDPOINTS.COMMENT.GET_ALL(projectId, issueId)),
  getById: (projectId: number, issueId: number, commentId: number) =>
    apiClient.get<any>(ENDPOINTS.COMMENT.GET_BY_ID(projectId, issueId, commentId)),
  update: (projectId: number, issueId: number, commentId: number, data: any) =>
    apiClient.patch<any>(ENDPOINTS.COMMENT.UPDATE(projectId, issueId, commentId), data),
  delete: (projectId: number, issueId: number, commentId: number) =>
    apiClient.delete<any>(ENDPOINTS.COMMENT.DELETE(projectId, issueId, commentId)),
};
export const BOARD_API = {
  getBoard: (boardId: number) =>
    apiClient.get<any>(ENDPOINTS.BOARD.GET_BOARD(boardId)),
  getTasks: (boardId: number) =>
    apiClient.get<TaskDto[]>(ENDPOINTS.BOARD.GET_TASKS(boardId)),
  createSprint: (boardId: number, data: any) =>
    apiClient.post<any>(ENDPOINTS.BOARD.CREATE_SPRINT(boardId), data),
  getSprint: (sprintId: number) =>
    apiClient.get<any>(ENDPOINTS.BOARD.GET_SPRINT(sprintId)),
  addTasksToSprint: (sprintId: number, data: any) =>
    apiClient.post<any>(ENDPOINTS.BOARD.ADD_TASKS_TO_SPRINT(sprintId), data),
  updateTaskPosition: (data: UpdateTaskPositionRequest) =>
    apiClient.patch<void>(ENDPOINTS.BOARD.UPDATE_TASK_POSITION(), data),
  reorderColumn: (columnId: number, boardId: number, taskIds: number[]) =>
    apiClient.post<any>(ENDPOINTS.BOARD.REORDER_COLUMN(columnId, boardId), taskIds),
};
const buildQueryString = (params?: Record<string, string | number | undefined>) => {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && !Number.isNaN(value)) {
      searchParams.append(key, value.toString());
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};
export const DASHBOARD_API = {
  getUserTasks: (params?: { departmentId?: number; userId?: number; projectId?: number }) =>
    apiClient.get<any>(
      `${ENDPOINTS.DASHBOARD.USER_TASKS}${buildQueryString({
        departmentId: params?.departmentId,
        userId: params?.userId,
        projectId: params?.projectId,
      })}`
    ),
  getAllUsers: () => apiClient.get<any>(ENDPOINTS.DASHBOARD.ALL_USERS),
};
export const TEAM_API = {
  getAll: (keyword?: string) =>
    apiClient.get<any>(keyword ? `${ENDPOINTS.TEAM.LIST}?keyword=${keyword}` : ENDPOINTS.TEAM.LIST),
  getById: (id: number) =>
    apiClient.get<any>(ENDPOINTS.TEAM.GET_BY_ID(id)),
  create: (data: any) =>
    apiClient.post<any>(ENDPOINTS.TEAM.CREATE, data),
  update: (id: number, data: any) =>
    apiClient.put<any>(ENDPOINTS.TEAM.UPDATE(id), data),
  delete: (id: number) =>
    apiClient.delete<any>(ENDPOINTS.TEAM.DELETE(id)),
  addMember: (id: number, userId: number) =>
    apiClient.post<any>(ENDPOINTS.TEAM.ADD_MEMBER(id), { userId }),
  removeMember: (id: number, userId: number) =>
    apiClient.delete<any>(ENDPOINTS.TEAM.REMOVE_MEMBER(id, userId)),
};
export const DEPARTMENT_API = {
  getAll: () =>
    apiClient.get<any>(ENDPOINTS.DEPARTMENT.LIST),
  getById: (id: number) =>
    apiClient.get<any>(ENDPOINTS.DEPARTMENT.GET_BY_ID(id)),
  create: (data: any) =>
    apiClient.post<any>(ENDPOINTS.DEPARTMENT.CREATE, data),
  update: (id: number, data: any) =>
    apiClient.put<any>(ENDPOINTS.DEPARTMENT.UPDATE(id), data),
  delete: (id: number) =>
    apiClient.delete<any>(ENDPOINTS.DEPARTMENT.DELETE(id)),
  getRoles: (id: number) =>
    apiClient.get<any>(ENDPOINTS.DEPARTMENT.GET_ROLES(id)),
  assignRoles: (id: number, data: any) =>
    apiClient.post<any>(ENDPOINTS.DEPARTMENT.ASSIGN_ROLES(id), data),
};
export const KANBAN_API = {
  getBoard: (boardId: number) =>
    BOARD_API.getBoard(boardId),
  getTasks: (boardId: number) =>
    BOARD_API.getTasks(boardId),
  updateTaskPosition: (data: UpdateTaskPositionRequest) =>
    BOARD_API.updateTaskPosition(data),
  getTaskDetail: (projectId: number, taskId: number) =>
    TASK_API.getDetail(projectId, taskId),
};