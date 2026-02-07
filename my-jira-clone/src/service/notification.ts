import { apiClient } from "../helper/api";

export interface NotificationDto {
  id: number;
  type: string;
  title: string;
  message: string;
  projectId?: number;
  projectName?: string;
  taskId?: number;
  taskTitle?: string;
  commentId?: number;
  evaluationId?: number;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  createdBy?: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface NotificationResponse {
  code: number;
  message: string;
  data: NotificationDto[];
}

export interface UnreadCountResponse {
  code: number;
  message: string;
  data: {
    count: number;
  };
}

export const NOTIFICATION_API = {
  // apiClient sẽ extract data từ response, nên return type là NotificationDto[] thay vì NotificationResponse
  getNotifications: (isRead?: boolean, limit?: number): Promise<NotificationDto[]> => {
    const params = new URLSearchParams();
    if (isRead !== undefined) params.append('isRead', isRead.toString());
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<NotificationResponse>(`/api/notification?${params.toString()}`) as Promise<NotificationDto[]>;
  },

  // apiClient sẽ extract data từ response, nên return type là { count: number } thay vì UnreadCountResponse
  getUnreadCount: (): Promise<{ count: number }> => {
    return apiClient.get<UnreadCountResponse>('/api/notification/unread-count') as Promise<{ count: number }>;
  },

  getNotification: (id: number) => {
    return apiClient.get<{ code: number; message: string; data: NotificationDto }>(`/api/notification/${id}`);
  },

  markAsRead: (id: number) => {
    return apiClient.patch<{ code: number; message: string; data: null }>(`/api/notification/${id}/read`);
  },

  markAllAsRead: () => {
    return apiClient.patch<{ code: number; message: string; data: null }>('/api/notification/mark-all-read');
  },

  deleteNotification: (id: number) => {
    return apiClient.delete<{ code: number; message: string; data: null }>(`/api/notification/${id}`);
  },
};
