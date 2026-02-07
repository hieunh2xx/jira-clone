namespace ManagementProject.DTO;
public class ProjectProgressDto
{
    public long ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public string? ProjectCode { get; set; }
    public int TotalTasks { get; set; }
    public int TodoTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int FixTasks { get; set; }
    public int ReviewTasks { get; set; }
    public int DoneTasks { get; set; }
    public int BlockedTasks { get; set; }
    public decimal CompletionPercentage { get; set; }
    public decimal TotalEstimatedHours { get; set; }
    public decimal TotalActualHours { get; set; }
    public int OverdueTasks { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public List<StatusCountDto> StatusBreakdown { get; set; } = new();
    public List<TaskProgressDto> RecentTasks { get; set; } = new();
}
public class StatusCountDto
{
    public string Status { get; set; } = null!;
    public string StatusName { get; set; } = null!;
    public int Count { get; set; }
    public string Color { get; set; } = "#DFE1E6";
}
public class TaskProgressDto
{
    public long TaskId { get; set; }
    public string TaskKey { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string StatusName { get; set; } = null!;
    public string Priority { get; set; } = null!;
    public DateTime? DueDate { get; set; }
    public bool IsOverdue { get; set; }
    public List<string> AssigneeNames { get; set; } = new();
}
public class ProjectSummaryDto
{
    public long ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public string? ProjectCode { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string TeamName { get; set; } = null!;
    public string? DepartmentName { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public decimal CompletionPercentage { get; set; }
    public int TotalMembers { get; set; }
    public int TotalEpics { get; set; }
    public decimal TotalEstimatedHours { get; set; }
    public decimal TotalActualHours { get; set; }
    public int OverdueTasks { get; set; }
    public List<StatusCountDto> StatusBreakdown { get; set; } = new();
    public List<EpicSummaryDto> Epics { get; set; } = new();
    public List<MemberSummaryDto> Members { get; set; } = new();
}
public class EpicSummaryDto
{
    public long EpicId { get; set; }
    public string EpicName { get; set; } = null!;
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public decimal CompletionPercentage { get; set; }
}
public class MemberSummaryDto
{
    public long UserId { get; set; }
    public string Username { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public int AssignedTasks { get; set; }
    public int CompletedTasks { get; set; }
}
public class AllProjectsDashboardDto
{
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; }
    public int CompletedProjects { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public decimal OverallCompletionPercentage { get; set; }
    public List<ProjectProgressDto> Projects { get; set; } = new();
}
public class UserTaskDashboardFilterDto
{
    public long? DepartmentId { get; set; }
    public long? UserId { get; set; }
    public long? ProjectId { get; set; }
}
public class UserTaskTimelineDto
{
    public long TaskId { get; set; }
    public string TaskKey { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Status { get; set; } = "todo";
    public string StatusName { get; set; } = "Cần làm";
    public string Priority { get; set; } = "medium";
    public DateTime? DueDate { get; set; }
    public bool IsOverdue { get; set; }
    public bool IsDueSoon { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public long? ParentTaskId { get; set; }
    public string? ParentTaskTitle { get; set; }
    public long ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public string ProjectCode { get; set; } = "";
    public List<string> AssigneeNames { get; set; } = new();
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }
}
public class UserTaskDashboardDto
{
    public long UserId { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public long? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<UserTaskTimelineDto> Tasks { get; set; } = new();
}
public class MyDayStatisticsDto
{
    public int Total { get; set; }
    public int Overdue { get; set; }
    public int DueToday { get; set; }
    public int DueTomorrow { get; set; }
    public int Completed { get; set; }
}