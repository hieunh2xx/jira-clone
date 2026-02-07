import { apiClient } from '../helper/api';

export interface ProjectEvaluationDto {
  id: number;
  projectId: number;
  userId: number;
  userName?: string;
  userFullName?: string;
  qualityRating?: number;
  qualityComment?: string;
  costRating?: number;
  costComment?: string;
  deliveryRating?: number;
  deliveryComment?: string;
  generalComment?: string;
  deploymentTime?: number;
  evaluatedAt?: string;
}

export interface ProjectEvaluationCreateDto {
  projectId: number;
  qualityRating?: number;
  qualityComment?: string;
  costRating?: number;
  costComment?: string;
  deliveryRating?: number;
  deliveryComment?: string;
  generalComment?: string;
  deploymentTime?: number;
}

export interface ProjectImprovementDto {
  id: number;
  projectId: number;
  type: 'before' | 'after';
  category: 'advantage' | 'disadvantage';
  content: string;
  orderIndex?: number;
}

export interface ProjectImprovementCreateDto {
  projectId: number;
  type: 'before' | 'after';
  category: 'advantage' | 'disadvantage';
  content: string;
  orderIndex?: number;
}

export interface ProjectTrialEvaluationDto {
  id: number;
  projectId: number;
  userId?: number;
  userName?: string;
  userFullName?: string;
  orderIndex: number;
  reductionItem: string;
  manHours?: string;
  beforeImprovement?: string;
  afterImprovement?: string;
  estimatedEfficiency?: string;
}

export interface ProjectTrialEvaluationItemDto {
  orderIndex: number;
  reductionItem: string;
  manHours?: string;
  beforeImprovement?: string;
  afterImprovement?: string;
  estimatedEfficiency?: string;
}

export interface ProjectTrialEvaluationCreateDto {
  projectId: number;
  items: ProjectTrialEvaluationItemDto[];
}

export interface ProjectImageDto {
  id: number;
  projectId: number;
  imageUrl: string;
  fileName?: string;
  fileSizeKb?: number;
  description?: string;
  uploadedBy?: number;
  uploadedByName?: string;
  uploadedAt?: string;
}

export interface ProjectImageCreateDto {
  projectId: number;
  imageUrl: string;
  fileName?: string;
  fileSizeKb?: number;
  description?: string;
}

export interface ProjectProcessDto {
  id: number;
  projectId: number;
  processDescription?: string;
  processOverview?: string;
}

export interface ProjectProcessCreateDto {
  projectId: number;
  processDescription?: string;
  processOverview?: string;
}

export interface ProjectEvaluationStatusDto {
  projectId: number;
  requiresEvaluation: boolean;
  hasEvaluated: boolean;
  totalMembers: number;
  evaluatedMembers: number;
  members: ProjectEvaluationMemberDto[];
}

export interface ProjectEvaluationMemberDto {
  userId: number;
  userName: string;
  fullName: string;
  hasEvaluated: boolean;
  evaluatedAt?: string;
}

const PROJECT_EVALUATION_API = {
  getEvaluation: (projectId: number) => 
    apiClient.get<ProjectEvaluationDto | null>(
      `/api/ProjectEvaluation/project/${projectId}`
    ),
  
  createOrUpdateEvaluation: (data: ProjectEvaluationCreateDto) =>
    apiClient.post<ProjectEvaluationDto>(
      '/api/ProjectEvaluation/evaluation',
      data
    ),
  
  getEvaluationsByProject: (projectId: number) =>
    apiClient.get<ProjectEvaluationDto[]>(
      `/api/ProjectEvaluation/project/${projectId}/all`
    ),
  
  getEvaluationStatus: (projectId: number) =>
    apiClient.get<ProjectEvaluationStatusDto>(
      `/api/ProjectEvaluation/project/${projectId}/status`
    ),
  
  getImprovements: (projectId: number, type?: string, userId?: number) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (userId) params.append('userId', userId.toString());
    const query = params.toString();
    return apiClient.get<ProjectImprovementDto[]>(
      `/api/ProjectEvaluation/project/${projectId}/improvements${query ? `?${query}` : ''}`
    );
  },
  
  createImprovement: (data: ProjectImprovementCreateDto) =>
    apiClient.post<ProjectImprovementDto>(
      '/api/ProjectEvaluation/improvements',
      data
    ),
  
  updateImprovement: (id: number, data: ProjectImprovementCreateDto) =>
    apiClient.put<ProjectImprovementDto>(
      `/api/ProjectEvaluation/improvements/${id}`,
      data
    ),
  
  deleteImprovement: (id: number) =>
    apiClient.delete<null>(
      `/api/ProjectEvaluation/improvements/${id}`
    ),
  
  getTrialEvaluations: (projectId: number, userId?: number) =>
    apiClient.get<ProjectTrialEvaluationDto[]>(
      `/api/ProjectEvaluation/project/${projectId}/trial-evaluations${userId ? `?userId=${userId}` : ''}`
    ),
  
  createOrUpdateTrialEvaluations: (data: ProjectTrialEvaluationCreateDto) =>
    apiClient.post<ProjectTrialEvaluationDto[]>(
      '/api/ProjectEvaluation/trial-evaluations',
      data
    ),
  
  getImages: (projectId: number, userId?: number) =>
    apiClient.get<ProjectImageDto[]>(
      `/api/ProjectEvaluation/project/${projectId}/images${userId ? `?userId=${userId}` : ''}`
    ),
  
  createImage: (data: ProjectImageCreateDto | FormData) =>
    apiClient.post<ProjectImageDto>(
      '/api/ProjectEvaluation/images',
      data,
      {
        isFormData: data instanceof FormData,
      }
    ),
  
  deleteImage: (id: number) =>
    apiClient.delete<null>(
      `/api/ProjectEvaluation/images/${id}`
    ),
  
  getProcess: (projectId: number, userId?: number) =>
    apiClient.get<ProjectProcessDto | null>(
      `/api/ProjectEvaluation/project/${projectId}/process${userId ? `?userId=${userId}` : ''}`
    ),
  
  createOrUpdateProcess: (data: ProjectProcessCreateDto) =>
    apiClient.post<ProjectProcessDto>(
      '/api/ProjectEvaluation/process',
      data
    ),
};

export const ProjectEvaluationService = {
  getEvaluation: async (projectId: number): Promise<ProjectEvaluationDto | null> => {
    // API helper already extracts data from { code, message, data } format
    const response = await PROJECT_EVALUATION_API.getEvaluation(projectId);
    return response || null;
  },
  
  createOrUpdateEvaluation: async (data: ProjectEvaluationCreateDto): Promise<ProjectEvaluationDto> => {
    const response = await PROJECT_EVALUATION_API.createOrUpdateEvaluation(data);
    return response;
  },
  
  getEvaluationsByProject: async (projectId: number): Promise<ProjectEvaluationDto[]> => {
    const response = await PROJECT_EVALUATION_API.getEvaluationsByProject(projectId);
    return Array.isArray(response) ? response : [];
  },
  
  getEvaluationStatus: async (projectId: number): Promise<ProjectEvaluationStatusDto> => {
    const response = await PROJECT_EVALUATION_API.getEvaluationStatus(projectId);
    return response;
  },
  
  getImprovements: async (projectId: number, type?: string, userId?: number): Promise<ProjectImprovementDto[]> => {
    const response = await PROJECT_EVALUATION_API.getImprovements(projectId, type, userId);
    return Array.isArray(response) ? response : [];
  },
  
  createImprovement: async (data: ProjectImprovementCreateDto): Promise<ProjectImprovementDto> => {
    const response = await PROJECT_EVALUATION_API.createImprovement(data);
    return response;
  },
  
  updateImprovement: async (id: number, data: ProjectImprovementCreateDto): Promise<ProjectImprovementDto> => {
    const response = await PROJECT_EVALUATION_API.updateImprovement(id, data);
    return response;
  },
  
  deleteImprovement: async (id: number): Promise<void> => {
    await PROJECT_EVALUATION_API.deleteImprovement(id);
  },
  
  getTrialEvaluations: async (projectId: number, userId?: number): Promise<ProjectTrialEvaluationDto[]> => {
    const response = await PROJECT_EVALUATION_API.getTrialEvaluations(projectId, userId);
    return Array.isArray(response) ? response : [];
  },
  
  createOrUpdateTrialEvaluations: async (data: ProjectTrialEvaluationCreateDto): Promise<ProjectTrialEvaluationDto[]> => {
    const response = await PROJECT_EVALUATION_API.createOrUpdateTrialEvaluations(data);
    return Array.isArray(response) ? response : [];
  },
  
  getImages: async (projectId: number, userId?: number): Promise<ProjectImageDto[]> => {
    const response = await PROJECT_EVALUATION_API.getImages(projectId, userId);
    return Array.isArray(response) ? response : [];
  },
  
  createImage: async (data: ProjectImageCreateDto | FormData): Promise<ProjectImageDto> => {
    const response = await PROJECT_EVALUATION_API.createImage(data);
    return response;
  },
  
  deleteImage: async (id: number): Promise<void> => {
    await PROJECT_EVALUATION_API.deleteImage(id);
  },
  
  getProcess: async (projectId: number, userId?: number): Promise<ProjectProcessDto | null> => {
    const response = await PROJECT_EVALUATION_API.getProcess(projectId, userId);
    return response || null;
  },
  
  createOrUpdateProcess: async (data: ProjectProcessCreateDto): Promise<ProjectProcessDto> => {
    const response = await PROJECT_EVALUATION_API.createOrUpdateProcess(data);
    return response;
  },
};
