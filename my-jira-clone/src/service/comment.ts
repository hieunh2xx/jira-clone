import { COMMENT_API } from '../helper/api';
export interface CommentDto {
  id: number;
  content: string;
  primaryImageUrl?: string;
  additionalImages: any[];
  files: any[];
  userId: number;
  username: string;
  fullName: string;
  isReview: boolean;
  rating?: number;
  parentCommentId?: number;
  createdAt: string;
  replies: CommentDto[];
}
export interface CreateCommentRequest {
  content: string;
  isReview?: boolean;
  rating?: number;
  parentCommentId?: number;
  files?: File[];
  images?: File[];
}
export interface UpdateCommentRequest {
  content?: string;
  isReview?: boolean;
  rating?: number;
}
export const CommentService = {
  create: async (projectId: number, issueId: number, data: CreateCommentRequest): Promise<CommentDto> => {
    const userId = parseInt(localStorage.getItem('userId') || '0');
    if (!userId) {
      throw new Error('User ID không tồn tại. Vui lòng đăng nhập lại.');
    }
    const formData = new FormData();
    formData.append('Content', data.content);
    formData.append('UserId', userId.toString());
    if (data.isReview !== undefined) formData.append('IsReview', data.isReview.toString());
    if (data.rating !== undefined) formData.append('Rating', data.rating.toString());
    if (data.parentCommentId) formData.append('ParentCommentId', data.parentCommentId.toString());
    if (data.files && data.files.length > 0) {
      data.files.forEach(file => formData.append('files', file));
    }
    if (data.images && data.images.length > 0) {
      data.images.forEach(file => formData.append('files', file));
    }
    return COMMENT_API.create(projectId, issueId, formData);
  },
  getAll: async (projectId: number, issueId: number): Promise<CommentDto[]> => {
    const response = await COMMENT_API.getAll(projectId, issueId);
    if (response && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return Array.isArray(response) ? response : [];
  },
  getById: (projectId: number, issueId: number, commentId: number): Promise<CommentDto> => {
    return COMMENT_API.getById(projectId, issueId, commentId);
  },
  update: (projectId: number, issueId: number, commentId: number, data: UpdateCommentRequest): Promise<CommentDto> => {
    return COMMENT_API.update(projectId, issueId, commentId, data);
  },
  delete: (projectId: number, issueId: number, commentId: number): Promise<void> => {
    return COMMENT_API.delete(projectId, issueId, commentId);
  },
};