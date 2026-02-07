using ManagementProject.DTO;

namespace ManagementProject.Services
{
    public interface IPowerBIExportService
    {
        Task<List<PowerBITaskDto>> GetTasksForExportAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBIProjectDto>> GetProjectsForExportAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBIUserPerformanceDto>> GetUserPerformanceForExportAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBITimeTrackingDto>> GetTimeTrackingForExportAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportTasksToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportProjectsToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportUserPerformanceToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportTimeTrackingToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<string> UploadTasksToAzureAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<string> UploadProjectsToAzureAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<string> UploadUserPerformanceToAzureAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<string> UploadTimeTrackingToAzureAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        
        // New report methods
        Task<PowerBIOverviewDto> GetOverviewAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBITaskProgressDto>> GetTaskProgressAsync(PowerBIExportFilterDto? filter = null, string periodType = "day", CancellationToken ct = default);
        Task<List<PowerBIOverdueRiskDto>> GetOverdueRisksAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBIWorkloadDto>> GetWorkloadDistributionAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBIBottleneckDto>> GetBottlenecksAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBISLADto>> GetSLAComplianceAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBIProjectComparisonDto>> GetProjectComparisonAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        
        // Export report methods to CSV
        Task<byte[]> ExportOverviewToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportTaskProgressToCsvAsync(PowerBIExportFilterDto? filter = null, string periodType = "day", CancellationToken ct = default);
        Task<byte[]> ExportOverdueRisksToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportWorkloadDistributionToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportBottlenecksToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportSLAComplianceToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportProjectComparisonToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        
        // Export to Excel methods
        Task<byte[]> ExportTasksToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportProjectsToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportUserPerformanceToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportTimeTrackingToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportOverviewToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportTaskProgressToExcelAsync(PowerBIExportFilterDto? filter = null, string periodType = "day", CancellationToken ct = default);
        Task<byte[]> ExportOverdueRisksToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportWorkloadDistributionToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportBottlenecksToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportSLAComplianceToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportProjectComparisonToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        
        // Phase 1: New Advanced Metrics APIs
        Task<List<PowerBICommunicationMetricsDto>> GetCommunicationMetricsAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBITaskLifecycleDto>> GetTaskLifecycleMetricsAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBISprintMetricsDto>> GetSprintMetricsAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<List<PowerBISprintBurndownDto>> GetSprintBurndownAsync(long sprintId, CancellationToken ct = default);
        
        // Export methods for new metrics
        Task<byte[]> ExportCommunicationMetricsToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportTaskLifecycleToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportSprintMetricsToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportCommunicationMetricsToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportTaskLifecycleToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
        Task<byte[]> ExportSprintMetricsToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default);
    }
}
