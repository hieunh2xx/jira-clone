import { apiClient } from "../helper/api";

export interface PowerBIExportFilter {
  projectId?: number;
  userId?: number;
  departmentId?: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
  statuses?: string;
  priorities?: string;
  includeCompleted?: boolean;
}

export interface PowerBIUploadResponse {
  code: number;
  message: string;
  data: {
    url: string;
    downloadUrl: string;
  };
}

export const POWER_BI_API = {
  // Get data as JSON
  getTasks: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    // Chỉ thêm statuses nếu có giá trị (không undefined/null/empty)
    if (filter?.statuses && filter.statuses.trim() !== '') params.append('statuses', filter.statuses);
    if (filter?.priorities && filter.priorities.trim() !== '') params.append('priorities', filter.priorities);
    // Mặc định includeCompleted = true nếu không được chỉ định
    params.append('includeCompleted', (filter?.includeCompleted ?? true).toString());
    
    return apiClient.get<any>(`/api/powerbi/tasks?${params.toString()}`);
  },

  getProjects: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<any>(`/api/powerbi/projects?${params.toString()}`);
  },

  getUserPerformance: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    
    return apiClient.get<any>(`/api/powerbi/user-performance?${params.toString()}`);
  },

  getTimeTracking: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<any>(`/api/powerbi/time-tracking?${params.toString()}`);
  },

  // Download CSV directly
  downloadTasksCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    // Chỉ thêm statuses nếu có giá trị (không undefined/null/empty)
    if (filter?.statuses && filter.statuses.trim() !== '') params.append('statuses', filter.statuses);
    if (filter?.priorities && filter.priorities.trim() !== '') params.append('priorities', filter.priorities);
    // Mặc định includeCompleted = true nếu không được chỉ định
    params.append('includeCompleted', (filter?.includeCompleted ?? true).toString());
    
    return apiClient.get<Blob>(`/api/powerbi/tasks/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadProjectsCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/projects/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadUserPerformanceCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    
    return apiClient.get<Blob>(`/api/powerbi/user-performance/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadTimeTrackingCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/time-tracking/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  // Upload to Cloudinary and get URL
  uploadTasks: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.statuses) params.append('statuses', filter.statuses);
    if (filter?.priorities) params.append('priorities', filter.priorities);
    if (filter?.includeCompleted !== undefined) params.append('includeCompleted', filter.includeCompleted.toString());
    
    return apiClient.post<PowerBIUploadResponse>(`/api/powerbi/tasks/upload?${params.toString()}`, {});
  },

  uploadProjects: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.post<PowerBIUploadResponse>(`/api/powerbi/projects/upload?${params.toString()}`, {});
  },

  uploadUserPerformance: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    
    return apiClient.post<PowerBIUploadResponse>(`/api/powerbi/user-performance/upload?${params.toString()}`, {});
  },

  uploadTimeTracking: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.post<PowerBIUploadResponse>(`/api/powerbi/time-tracking/upload?${params.toString()}`, {});
  },

  // New report endpoints
  getOverview: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<any>(`/api/powerbi/overview?${params.toString()}`);
  },

  getTaskProgress: (filter?: PowerBIExportFilter & { periodType?: 'day' | 'week' | 'month' }) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.periodType) params.append('periodType', filter.periodType);
    
    return apiClient.get<any>(`/api/powerbi/task-progress?${params.toString()}`);
  },

  getOverdueRisks: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<any>(`/api/powerbi/overdue-risks?${params.toString()}`);
  },

  getWorkloadDistribution: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    
    return apiClient.get<any>(`/api/powerbi/workload?${params.toString()}`);
  },

  getBottlenecks: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<any>(`/api/powerbi/bottlenecks?${params.toString()}`);
  },

  getSLACompliance: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<any>(`/api/powerbi/sla-compliance?${params.toString()}`);
  },

  getProjectComparison: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<any>(`/api/powerbi/project-comparison?${params.toString()}`);
  },

  // Export report data to CSV
  downloadOverviewCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/overview/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadTaskProgressCsv: (filter?: PowerBIExportFilter & { periodType?: 'day' | 'week' | 'month' }) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.periodType) params.append('periodType', filter.periodType);
    
    return apiClient.get<Blob>(`/api/powerbi/task-progress/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadOverdueRisksCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/overdue-risks/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadWorkloadDistributionCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    
    return apiClient.get<Blob>(`/api/powerbi/workload/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadBottlenecksCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/bottlenecks/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadSLAComplianceCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/sla-compliance/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadProjectComparisonCsv: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/project-comparison/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  // New endpoints for data sources
  getAllDataSources: () => {
    return apiClient.get<any>('/api/powerbi/data-sources');
  },

  getDataSource: (id: string, filter?: PowerBIExportFilter & { periodType?: 'day' | 'week' | 'month' }) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.statuses) params.append('statuses', filter.statuses);
    if (filter?.priorities) params.append('priorities', filter.priorities);
    if (filter?.includeCompleted !== undefined) params.append('includeCompleted', filter.includeCompleted.toString());
    if (filter?.periodType) params.append('periodType', filter.periodType);
    
    return apiClient.get<any>(`/api/powerbi/data-sources/${id}?${params.toString()}`);
  },

  // Download Excel methods
  downloadOverviewExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/overview/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadTaskProgressExcel: (filter?: PowerBIExportFilter & { periodType?: 'day' | 'week' | 'month' }) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.periodType) params.append('periodType', filter.periodType);
    
    return apiClient.get<Blob>(`/api/powerbi/task-progress/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadOverdueRisksExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/overdue-risks/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadWorkloadExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    
    return apiClient.get<Blob>(`/api/powerbi/workload/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadBottlenecksExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/bottlenecks/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadSLAComplianceExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/sla-compliance/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadProjectComparisonExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/project-comparison/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadTasksExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.statuses) params.append('statuses', filter.statuses);
    if (filter?.priorities) params.append('priorities', filter.priorities);
    if (filter?.includeCompleted !== undefined) params.append('includeCompleted', filter.includeCompleted.toString());
    
    return apiClient.get<Blob>(`/api/powerbi/tasks/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadProjectsExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/projects/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadUserPerformanceExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.departmentId) params.append('departmentId', filter.departmentId.toString());
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    
    return apiClient.get<Blob>(`/api/powerbi/user-performance/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  downloadTimeTrackingExcel: (filter?: PowerBIExportFilter) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId.toString());
    if (filter?.userId) params.append('userId', filter.userId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return apiClient.get<Blob>(`/api/powerbi/time-tracking/excel?${params.toString()}`, {
      responseType: 'blob'
    });
  },
};
