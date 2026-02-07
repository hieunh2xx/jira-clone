
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export interface UpdateTaskPositionRequest {
  taskId: number;
  columnId: number;
  position: number;
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
export interface KanbanColumnDto {
  id?: number;
  columnId?: number;
  status: TaskStatus;
  color: string;
  tasks: TaskDto[];
}
export interface KanbanBoardDto {
  columns: KanbanColumnDto[];
}
export interface TaskCommentDto {
  id: number;
  content: string;
  primaryImageUrl?: string;
  additionalImages: TaskCommentImageDto[];
  files: TaskCommentFileDto[];
  userId: number;
  username: string;
  fullName: string;
  isReview: boolean;
  rating?: number;
  parentCommentId?: number;
  createdAt: string;
  replies: TaskCommentDto[];
}
export interface TaskCommentImageDto {
  id: number;
  imageUrl: string;
  fileName?: string;
  fileSizeKb?: number;
  uploadedAt: string;
}
export interface TaskCommentFileDto {
  id: number;
  fileUrl: string;
  fileName: string;
  fileSizeKb?: number;
  uploadedAt: string;
}
export interface TaskDetailDto extends TaskDto {
  comments: TaskCommentDto[];
  customFields: Record<string, string>;
}