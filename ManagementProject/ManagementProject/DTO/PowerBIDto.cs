using System;
using System.Collections.Generic;

namespace ManagementProject.DTO
{
    /// <summary>
    /// DTO cho Task export sang Power BI
    /// </summary>
    public class PowerBITaskDto
    {
        public long TaskId { get; set; }
        public string TaskKey { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Status { get; set; } = null!;
        public string StatusName { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public DateTime? DueDate { get; set; }
        public bool IsOverdue { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public decimal? HoursVariance { get; set; }
        public decimal? CompletionPercentage { get; set; }
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string? ProjectCode { get; set; }
        public string? ProjectStatus { get; set; }
        public long? EpicId { get; set; }
        public string? EpicName { get; set; }
        public long IssueTypeId { get; set; }
        public string IssueTypeName { get; set; } = null!;
        public long? ParentTaskId { get; set; }
        public string? ParentTaskTitle { get; set; }
        public string? AssigneeIds { get; set; } // Comma-separated for CSV
        public string? AssigneeNames { get; set; } // Comma-separated for CSV
        public long? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? DaysSinceCreated { get; set; }
        public int? DaysUntilDue { get; set; }
        public int? DaysOverdue { get; set; }
        public string? TeamName { get; set; }
        public string? DepartmentName { get; set; }
    }

    /// <summary>
    /// DTO cho Project export sang Power BI
    /// </summary>
    public class PowerBIProjectDto
    {
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string? ProjectCode { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public bool? IsCompleted { get; set; }
        public int TotalTasks { get; set; }
        public int TodoTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int ReviewTasks { get; set; }
        public int FixTasks { get; set; }
        public int DoneTasks { get; set; }
        public int BlockedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public decimal CompletionPercentage { get; set; }
        public decimal? TotalEstimatedHours { get; set; }
        public decimal? TotalActualHours { get; set; }
        public decimal? HoursVariance { get; set; }
        public int TotalMembers { get; set; }
        public int TotalEpics { get; set; }
        public long TeamId { get; set; }
        public string TeamName { get; set; } = null!;
        public string? DepartmentName { get; set; }
        public long? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? ProjectDurationDays { get; set; }
        public int? DaysRemaining { get; set; }
        public bool IsOverdue { get; set; }
    }

    /// <summary>
    /// DTO cho User Performance export sang Power BI
    /// </summary>
    public class PowerBIUserPerformanceDto
    {
        public long UserId { get; set; }
        public string Username { get; set; } = null!;
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? EmployeeCode { get; set; }
        public long? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int TotalAssignedTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int DueTodayTasks { get; set; }
        public decimal CompletionRate { get; set; }
        public decimal? TotalEstimatedHours { get; set; }
        public decimal? TotalActualHours { get; set; }
        public decimal? AverageHoursPerTask { get; set; }
        public int TotalProjects { get; set; }
        public DateTime? LastActivityDate { get; set; }
    }

    /// <summary>
    /// DTO cho Time Tracking export sang Power BI
    /// </summary>
    public class PowerBITimeTrackingDto
    {
        public long TaskId { get; set; }
        public string TaskKey { get; set; } = null!;
        public string TaskTitle { get; set; } = null!;
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public long UserId { get; set; }
        public string UserName { get; set; } = null!;
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public decimal? HoursVariance { get; set; }
        public decimal? EfficiencyPercentage { get; set; }
        public string Status { get; set; } = null!;
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public int? DaysToComplete { get; set; }
    }

    /// <summary>
    /// Filter DTO cho export
    /// </summary>
    public class PowerBIExportFilterDto
    {
        public long? ProjectId { get; set; }
        public long? UserId { get; set; }
        public long? DepartmentId { get; set; }
        public long? TeamId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<string>? Statuses { get; set; }
        public List<string>? Priorities { get; set; }
        public bool? IncludeCompleted { get; set; } = true;
    }

    /// <summary>
    /// DTO cho Overview Dashboard - Tổng quan công việc
    /// </summary>
    public class PowerBIOverviewDto
    {
        public int TotalTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public decimal CompletionRate { get; set; }
        public DateTime ReportDate { get; set; }
    }

    /// <summary>
    /// DTO cho Task theo thời gian (Created vs Completed)
    /// </summary>
    public class PowerBITaskProgressDto
    {
        public DateTime Date { get; set; }
        public string DateKey { get; set; } = null!; // Format: yyyy-MM-dd
        public int CreatedTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int NetTasks { get; set; } // Created - Completed
        public string PeriodType { get; set; } = null!; // "day", "week", "month"
    }

    /// <summary>
    /// DTO cho Công việc quá hạn & rủi ro
    /// </summary>
    public class PowerBIOverdueRiskDto
    {
        public long TaskId { get; set; }
        public string TaskKey { get; set; } = null!;
        public string Title { get; set; } = null!;
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string? ProjectCode { get; set; }
        public DateTime? DueDate { get; set; }
        public int DaysOverdue { get; set; }
        public int DaysUntilDue { get; set; } // Negative if overdue
        public bool IsOverdue { get; set; }
        public bool IsDueSoon { get; set; } // 3-7 days
        public string Priority { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? AssigneeNames { get; set; }
        public string? TeamName { get; set; }
        public string? DepartmentName { get; set; }
    }

    /// <summary>
    /// DTO cho Phân bổ workload
    /// </summary>
    public class PowerBIWorkloadDto
    {
        public long UserId { get; set; }
        public string UserName { get; set; } = null!;
        public string? FullName { get; set; }
        public string? DepartmentName { get; set; }
        public int TotalTasks { get; set; }
        public int HighPriorityTasks { get; set; }
        public int MediumPriorityTasks { get; set; }
        public int LowPriorityTasks { get; set; }
        public int TodoTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int ReviewTasks { get; set; }
        public int DoneTasks { get; set; }
        public decimal? TotalEstimatedHours { get; set; }
        public decimal? TotalActualHours { get; set; }
        public int OverdueTasks { get; set; }
        public decimal WorkloadPercentage { get; set; } // So với team average
    }

    /// <summary>
    /// DTO cho Bottleneck & nguyên nhân
    /// </summary>
    public class PowerBIBottleneckDto
    {
        public long TaskId { get; set; }
        public string TaskKey { get; set; } = null!;
        public string Title { get; set; } = null!;
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DueDate { get; set; }
        public int DaysInStatus { get; set; }
        public int ReopenCount { get; set; }
        public int StatusChangeCount { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsWaitingApproval { get; set; }
        public string? BlockedReason { get; set; }
        public string? AssigneeNames { get; set; }
        public string Priority { get; set; } = null!;
    }

    /// <summary>
    /// DTO cho SLA / Deadline compliance
    /// </summary>
    public class PowerBISLADto
    {
        public long TaskId { get; set; }
        public string TaskKey { get; set; } = null!;
        public string Title { get; set; } = null!;
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public bool CompletedOnTime { get; set; }
        public int? DaysToComplete { get; set; }
        public int? DaysOverdue { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public string Status { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string? AssigneeNames { get; set; }
        public string? TeamName { get; set; }
        public string? DepartmentName { get; set; }
    }

    /// <summary>
    /// DTO cho So sánh các project
    /// </summary>
    public class PowerBIProjectComparisonDto
    {
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string? ProjectCode { get; set; }
        public string? Status { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public decimal CompletionRate { get; set; }
        public decimal OnTimeCompletionRate { get; set; }
        public decimal? AverageDaysToComplete { get; set; }
        public int TotalMembers { get; set; }
        public decimal? TotalEstimatedHours { get; set; }
        public decimal? TotalActualHours { get; set; }
        public decimal? EfficiencyPercentage { get; set; }
        public string? TeamName { get; set; }
        public string? DepartmentName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public bool IsOverdue { get; set; }
    }

    /// <summary>
    /// DTO cho thông tin loại biểu đồ Power BI
    /// </summary>
    public class PowerBIDataSourceDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string JsonApiUrl { get; set; } = null!;
        public string ExcelDownloadUrl { get; set; } = null!;
        public string CsvDownloadUrl { get; set; } = null!;
        public List<string> SupportedFilters { get; set; } = new();
        public string Purpose { get; set; } = null!;
        public List<string> RecommendedCharts { get; set; } = new();
    }

    /// <summary>
    /// DTO cho response chứa link và download option
    /// </summary>
    public class PowerBIDataSourceResponseDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Purpose { get; set; } = null!;
        public PowerBIDataSourceLinksDto Links { get; set; } = new();
        public List<string> RecommendedCharts { get; set; } = new();
        public List<string> SupportedFilters { get; set; } = new();
    }

    /// <summary>
    /// DTO cho các link download và API
    /// </summary>
    public class PowerBIDataSourceLinksDto
    {
        /// <summary>
        /// Link JSON API để import trực tiếp vào Power BI (Get Data > Web)
        /// </summary>
        public string JsonApiUrl { get; set; } = null!;
        
        /// <summary>
        /// Link download file Excel (.xlsx)
        /// </summary>
        public string ExcelDownloadUrl { get; set; } = null!;
        
        /// <summary>
        /// Link download file CSV
        /// </summary>
        public string CsvDownloadUrl { get; set; } = null!;
        
        /// <summary>
        /// Hướng dẫn sử dụng
        /// </summary>
        public string UsageInstructions { get; set; } = null!;
    }

    /// <summary>
    /// DTO cho Communication & Collaboration Metrics
    /// </summary>
    public class PowerBICommunicationMetricsDto
    {
        public long TaskId { get; set; }
        public string TaskKey { get; set; } = null!;
        public string TaskTitle { get; set; } = null!;
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public int TotalComments { get; set; }
        public int TotalReplies { get; set; }
        public int UniqueContributors { get; set; }
        public decimal? AverageResponseTimeHours { get; set; }
        public int TotalFiles { get; set; }
        public int TotalImages { get; set; }
        public int ReviewCount { get; set; }
        public decimal? AverageRating { get; set; }
        public DateTime? FirstCommentDate { get; set; }
        public DateTime? LastCommentDate { get; set; }
        public int? DaysSinceLastComment { get; set; }
        public string? TeamName { get; set; }
        public string? DepartmentName { get; set; }
    }

    /// <summary>
    /// DTO cho Task Lifecycle & Velocity Metrics
    /// </summary>
    public class PowerBITaskLifecycleDto
    {
        public long TaskId { get; set; }
        public string TaskKey { get; set; } = null!;
        public string TaskTitle { get; set; } = null!;
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
        public DateTime? FirstAssignedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int? CycleTimeDays { get; set; } // Created to Completed
        public int? LeadTimeDays { get; set; } // Assigned to Completed
        public int? TimeInTodoDays { get; set; }
        public int? TimeInProgressDays { get; set; }
        public int? TimeInReviewDays { get; set; }
        public int? TimeInFixDays { get; set; }
        public int StatusChangeCount { get; set; }
        public int ReopenCount { get; set; }
        public string Status { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string? AssigneeNames { get; set; }
        public string? TeamName { get; set; }
        public string? DepartmentName { get; set; }
    }

    /// <summary>
    /// DTO cho Sprint & Agile Metrics
    /// </summary>
    public class PowerBISprintMetricsDto
    {
        public long SprintId { get; set; }
        public string SprintName { get; set; } = null!;
        public long BoardId { get; set; }
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Status { get; set; } = null!;
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int TodoTasks { get; set; }
        public decimal CompletionRate { get; set; }
        public decimal? Velocity { get; set; } // Completed tasks or story points
        public int? DaysRemaining { get; set; }
        public bool IsActive { get; set; }
        public bool IsCompleted { get; set; }
        public bool GoalAchieved { get; set; }
        public string? TeamName { get; set; }
        public string? DepartmentName { get; set; }
    }

    /// <summary>
    /// DTO cho Sprint Burndown Data
    /// </summary>
    public class PowerBISprintBurndownDto
    {
        public long SprintId { get; set; }
        public string SprintName { get; set; } = null!;
        public DateTime Date { get; set; }
        public string DateKey { get; set; } = null!; // Format: yyyy-MM-dd
        public int RemainingTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int TotalTasks { get; set; }
        public decimal? RemainingHours { get; set; }
        public decimal? CompletedHours { get; set; }
        public decimal? TotalHours { get; set; }
        public int DaysIntoSprint { get; set; }
        public int TotalSprintDays { get; set; }
    }
}
