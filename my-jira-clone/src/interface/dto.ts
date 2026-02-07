
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export interface TaskDto {
  id: number;
  key: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: string;
  dueDate?: string | null;
  isOverdue?: boolean | null;
  estimatedHours: number;
  actualHours: number;
  projectId: number;
  projectName: string;
  epicId?: number | null;
  epicName?: string | null;
  issueTypeId: number;
  issueTypeName: string;
  parentTaskId?: number | null;
  parentTaskTitle?: string | null;
  assigneeIds: number[];
  assigneeNames: string[];
  categoryIds: number[];
  categoryNames: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  createdByName: string;
  images: TaskImageDto[];
  files: TaskFileDto[];
}
export interface TaskImageDto {
  id: number;
  fileName: string;
  imageUrl: string;
  fileSizeKb: number;
  uploadedAt: string;
}
export interface TaskFileDto {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSizeKb: number;
  uploadedAt: string;
}
export interface KanbanColumnDto {
  status: TaskStatus;
  color: string;
  tasks: TaskDto[];
}
export interface KanbanBoardDto {
  columns: KanbanColumnDto[];
}
export interface UserDto {
  id: number;
  employeeCode: string;
  username: string;
  email: string;
  fullName: string;
  departmentId?: number | null;
  departmentName: string;
  avatarUrl?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  roleId?: number[];
  roleName?: string[];
  teamIds: number[];
}