import { TASK_API } from '../helper/api';
import { TaskDetailDto, KanbanBoardDto } from '../interface/kanbanInterface';
export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  epicId?: number;
  issueTypeId?: number;
  parentTaskId?: number;
  assigneeIds?: number[];
  categoryIds?: number[];
  createdBy: number;
  images?: File[];
  files?: File[];
}
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  epicId?: number;
  issueTypeId?: number;
  parentTaskId?: number;
  assigneeIds?: number[];
  categoryIds?: number[];
  images?: File[];
  files?: File[];
}
export const TaskService = {
  create: async (projectId: number, data: CreateTaskRequest): Promise<TaskDetailDto> => {
    const formData = new FormData();
    formData.append('Title', data.title);
    if (data.description) formData.append('Description', data.description);
    if (data.status) formData.append('Status', data.status);
    if (data.priority) formData.append('Priority', data.priority);
    if (data.dueDate) formData.append('DueDate', data.dueDate);
    if (data.estimatedHours !== undefined) formData.append('EstimatedHours', data.estimatedHours.toString());
    if (data.epicId) formData.append('EpicId', data.epicId.toString());
    if (data.issueTypeId) formData.append('IssueTypeId', data.issueTypeId.toString());
    if (data.parentTaskId) formData.append('ParentTaskId', data.parentTaskId.toString());
    formData.append('CreatedBy', data.createdBy.toString());
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      data.assigneeIds.forEach(id => formData.append('AssigneeIds', id.toString()));
    }
    if (data.categoryIds && data.categoryIds.length > 0) {
      data.categoryIds.forEach(id => formData.append('CategoryIds', id.toString()));
    }
    if (data.images && data.images.length > 0) {
      console.log('[TaskService] Appending images:', data.images.length);
      data.images.forEach((file, index) => {
        console.log(`[TaskService] Image ${index}:`, file.name, file.type, file.size);
        formData.append('images', file);
      });
    }
    if (data.files && data.files.length > 0) {
      console.log('[TaskService] Appending files:', data.files.length);
      data.files.forEach((file, index) => {
        console.log(`[TaskService] File ${index}:`, file.name, file.type, file.size);
        formData.append('files', file);
      });
    }
    return TASK_API.create(projectId, formData);
  },
  getDetail: (projectId: number, taskId: number): Promise<TaskDetailDto> => {
    return TASK_API.getDetail(projectId, taskId);
  },
  update: async (projectId: number, taskId: number, data: UpdateTaskRequest): Promise<TaskDetailDto> => {
    const formData = new FormData();
    if (data.title) formData.append('Title', data.title);
    if (data.description) formData.append('Description', data.description);
    if (data.status) formData.append('Status', data.status);
    if (data.priority) formData.append('Priority', data.priority);
    if (data.dueDate) formData.append('DueDate', data.dueDate);
    if (data.estimatedHours !== undefined) formData.append('EstimatedHours', data.estimatedHours.toString());
    if (data.actualHours !== undefined) formData.append('ActualHours', data.actualHours.toString());
    if (data.epicId) formData.append('EpicId', data.epicId.toString());
    if (data.issueTypeId) formData.append('IssueTypeId', data.issueTypeId.toString());
    if (data.parentTaskId) formData.append('ParentTaskId', data.parentTaskId.toString());
    if (data.assigneeIds !== undefined) {
      // Only append if array is not empty, don't append empty string
      if (data.assigneeIds.length > 0) {
        data.assigneeIds.forEach(id => formData.append('AssigneeIds', id.toString()));
      }
      // If empty array, don't append anything - backend will handle as empty list
    }
    if (data.categoryIds && data.categoryIds.length > 0) {
      data.categoryIds.forEach(id => formData.append('CategoryIds', id.toString()));
    }
    if (data.images && data.images.length > 0) {
      data.images.forEach(file => formData.append('images', file));
    }
    if (data.files && data.files.length > 0) {
      data.files.forEach(file => formData.append('files', file));
    }
    return TASK_API.update(projectId, taskId, formData);
  },
  delete: (projectId: number, taskId: number): Promise<void> => {
    return TASK_API.delete(projectId, taskId);
  },
  getKanban: (projectId: number): Promise<KanbanBoardDto> => {
    return TASK_API.getKanban(projectId);
  },
  updateStatus: (projectId: number, taskId: number, status: string, userId: number = 1): Promise<void> => {
    return TASK_API.updateStatus(projectId, taskId, status, userId);
  },
};