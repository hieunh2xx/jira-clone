import { DASHBOARD_API } from '../helper/api';
import { UserDto } from '../interface/dto';
export interface UserTaskTimelineDto {
  taskId: number;
  taskKey: string;
  title: string;
  status: string;
  statusName: string;
  priority: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  assignedAt?: string | null;
  parentTaskId?: number | null;
  parentTaskTitle?: string | null;
  projectId: number;
  projectName: string;
  projectCode: string;
  assigneeNames: string[];
  estimatedHours?: number | null;
  actualHours?: number | null;
}
export interface UserTaskDashboardDto {
  userId: number;
  fullName: string;
  email: string;
  departmentId?: number | null;
  departmentName?: string | null;
  roles: string[];
  tasks: UserTaskTimelineDto[];
}
export const DashboardService = {
  getUserTaskDashboard: (params?: { departmentId?: number; userId?: number; projectId?: number }): Promise<UserTaskDashboardDto[]> => {
    return DASHBOARD_API.getUserTasks(params);
  },
  getAllUsers: (): Promise<UserDto[]> => {
    return DASHBOARD_API.getAllUsers();
  },
};