using DataAccess.Models;
using ManagementProject.DTO;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.Drawing;
using System.Threading;
using System.Threading.Tasks;
using TaskModel = DataAccess.Models.Task;

namespace ManagementProject.Services
{
    public class PowerBIExportService : IPowerBIExportService
    {
        private readonly ProjectManagementDbContext _ctx;
        private readonly IAzureBlobService? _blobService;
        private readonly CloudinaryService? _cloudinaryService;

        public PowerBIExportService(ProjectManagementDbContext ctx, IAzureBlobService? blobService = null, CloudinaryService? cloudinaryService = null)
        {
            _ctx = ctx;
            _blobService = blobService;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<List<PowerBITaskDto>> GetTasksForExportAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var query = _ctx.Tasks
                .AsNoTracking()
                .Include(t => t.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Department)
                .Include(t => t.Epic)
                .Include(t => t.IssueType)
                .Include(t => t.ParentTask)
                .Include(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
                .Include(t => t.CreatedByNavigation)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.ProjectId.HasValue)
                    query = query.Where(t => t.ProjectId == filter.ProjectId.Value);

                if (filter.UserId.HasValue)
                    query = query.Where(t => t.TaskAssignments.Any(ta => ta.UserId == filter.UserId.Value));

                if (filter.DepartmentId.HasValue)
                    query = query.Where(t => t.Project.Team.DepartmentId == filter.DepartmentId.Value);

                if (filter.TeamId.HasValue)
                    query = query.Where(t => t.Project.TeamId == filter.TeamId.Value);

                if (filter.StartDate.HasValue)
                    query = query.Where(t => t.CreatedAt >= filter.StartDate.Value);

                if (filter.EndDate.HasValue)
                    query = query.Where(t => t.CreatedAt <= filter.EndDate.Value);

                if (filter.Statuses != null && filter.Statuses.Any())
                    query = query.Where(t => filter.Statuses.Contains(t.Status ?? "todo"));

                if (filter.Priorities != null && filter.Priorities.Any())
                    query = query.Where(t => filter.Priorities.Contains(t.Priority ?? "medium"));

                if (filter.IncludeCompleted == false)
                    query = query.Where(t => t.Status != "done");
            }

            var tasks = await query.ToListAsync(ct);
            var now = DateTime.UtcNow;
            var today = now.Date;

            var result = tasks.Select(t =>
            {
                var projectCode = t.Project?.Code ?? "";
                var taskKey = !string.IsNullOrEmpty(projectCode) ? $"{projectCode}-{t.Id}" : $"TASK-{t.Id}";
                var status = t.Status ?? "todo";
                var dueDate = t.DueDate;
                var isOverdue = dueDate.HasValue && dueDate.Value.Date < today && status != "done";
                var assigneeIds = t.TaskAssignments.Select(ta => ta.UserId.ToString()).ToList();
                var assigneeNames = t.TaskAssignments
                    .Select(ta => ta.User != null && (!string.IsNullOrWhiteSpace(ta.User.FirstName) || !string.IsNullOrWhiteSpace(ta.User.LastName))
                        ? $"{ta.User.FirstName} {ta.User.LastName}".Trim()
                        : ta.User?.Username ?? "")
                    .Where(name => !string.IsNullOrEmpty(name))
                    .ToList();

                var estimatedHours = t.EstimatedHours ?? 0;
                var actualHours = t.ActualHours ?? 0;
                var hoursVariance = actualHours - estimatedHours;
                var completionPercentage = status == "done" ? 100 : 0;

                var createdAt = t.CreatedAt ?? DateTime.UtcNow;
                var daysSinceCreated = (int)(now.Date - createdAt.Date).TotalDays;
                var daysUntilDue = dueDate.HasValue ? (int?)(dueDate.Value.Date - today).TotalDays : null;
                var daysOverdue = isOverdue && dueDate.HasValue ? (int?)(today - dueDate.Value.Date).TotalDays : null;

                return new PowerBITaskDto
                {
                    TaskId = t.Id,
                    TaskKey = taskKey,
                    Title = t.Title ?? "",
                    Description = t.Description,
                    Status = status,
                    StatusName = GetStatusName(status),
                    Priority = t.Priority ?? "medium",
                    DueDate = dueDate,
                    IsOverdue = isOverdue,
                    EstimatedHours = estimatedHours > 0 ? estimatedHours : (decimal?)null,
                    ActualHours = actualHours > 0 ? actualHours : (decimal?)null,
                    HoursVariance = hoursVariance != 0 ? hoursVariance : (decimal?)null,
                    CompletionPercentage = completionPercentage > 0 ? completionPercentage : (decimal?)null,
                    ProjectId = t.ProjectId,
                    ProjectName = t.Project?.Name ?? "",
                    ProjectCode = projectCode,
                    ProjectStatus = t.Project?.Status,
                    EpicId = t.EpicId,
                    EpicName = t.Epic?.Name,
                    IssueTypeId = t.IssueTypeId,
                    IssueTypeName = t.IssueType?.Name ?? "",
                    ParentTaskId = t.ParentTaskId,
                    ParentTaskTitle = t.ParentTask?.Title,
                    AssigneeIds = string.Join(",", assigneeIds),
                    AssigneeNames = string.Join(",", assigneeNames),
                    CreatedBy = t.CreatedBy,
                    CreatedByName = t.CreatedByNavigation != null
                        ? $"{t.CreatedByNavigation.FirstName} {t.CreatedByNavigation.LastName}".Trim()
                        : t.CreatedByNavigation?.Username,
                    CreatedAt = createdAt,
                    UpdatedAt = t.UpdatedAt,
                    DaysSinceCreated = daysSinceCreated,
                    DaysUntilDue = daysUntilDue,
                    DaysOverdue = daysOverdue,
                    TeamName = t.Project?.Team?.Name,
                    DepartmentName = t.Project?.Team?.Department?.Name
                };
            }).ToList();

            return result;
        }

        public async Task<List<PowerBIProjectDto>> GetProjectsForExportAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var query = _ctx.Projects
                .AsNoTracking()
                .Include(p => p.Tasks)
                .Include(p => p.Team)
                    .ThenInclude(t => t.Department)
                .Include(p => p.Epics)
                .Include(p => p.UserProjectAssignments)
                .Include(p => p.CreatedByNavigation)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.ProjectId.HasValue)
                    query = query.Where(p => p.Id == filter.ProjectId.Value);

                if (filter.DepartmentId.HasValue)
                    query = query.Where(p => p.Team.DepartmentId == filter.DepartmentId.Value);

                if (filter.TeamId.HasValue)
                    query = query.Where(p => p.TeamId == filter.TeamId.Value);

                if (filter.StartDate.HasValue)
                    query = query.Where(p => p.CreatedAt >= filter.StartDate.Value);

                if (filter.EndDate.HasValue)
                    query = query.Where(p => p.CreatedAt <= filter.EndDate.Value);
            }

            var projects = await query.ToListAsync(ct);
            var now = DateTime.UtcNow;
            var today = now.Date;

            var result = projects.Select(p =>
            {
                var tasks = p.Tasks.ToList();
                var todoTasks = tasks.Count(t => t.Status == "todo");
                var inProgressTasks = tasks.Count(t => t.Status == "in_progress");
                var reviewTasks = tasks.Count(t => t.Status == "review");
                var fixTasks = tasks.Count(t => t.Status == "fix");
                var doneTasks = tasks.Count(t => t.Status == "done");
                var blockedTasks = tasks.Count(t => t.Status == "blocked");
                var totalTasks = tasks.Count;
                var overdueTasks = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value.Date < today && t.Status != "done");
                var completionPercentage = totalTasks > 0
                    ? Math.Round((decimal)doneTasks / totalTasks * 100, 2)
                    : 0;

                var totalEstimatedHours = tasks.Where(t => t.EstimatedHours.HasValue).Sum(t => t.EstimatedHours!.Value);
                var totalActualHours = tasks.Where(t => t.ActualHours.HasValue).Sum(t => t.ActualHours!.Value);
                var hoursVariance = totalActualHours - totalEstimatedHours;

                var startDate = p.StartDate;
                var dueDate = p.DueDate;
                var projectDurationDays = startDate.HasValue && dueDate.HasValue
                    ? (int?)(dueDate.Value.Date - startDate.Value.Date).TotalDays
                    : null;
                var daysRemaining = dueDate.HasValue ? (int?)(dueDate.Value.Date - today).TotalDays : null;
                var isOverdue = dueDate.HasValue && dueDate.Value.Date < today && !(p.IsCompleted ?? false);

                return new PowerBIProjectDto
                {
                    ProjectId = p.Id,
                    ProjectName = p.Name,
                    ProjectCode = p.Code,
                    Description = p.Description,
                    Status = p.Status,
                    StartDate = startDate,
                    DueDate = dueDate,
                    CompletedAt = p.CompletedAt,
                    IsCompleted = p.IsCompleted,
                    TotalTasks = totalTasks,
                    TodoTasks = todoTasks,
                    InProgressTasks = inProgressTasks,
                    ReviewTasks = reviewTasks,
                    FixTasks = fixTasks,
                    DoneTasks = doneTasks,
                    BlockedTasks = blockedTasks,
                    OverdueTasks = overdueTasks,
                    CompletionPercentage = completionPercentage,
                    TotalEstimatedHours = totalEstimatedHours > 0 ? totalEstimatedHours : (decimal?)null,
                    TotalActualHours = totalActualHours > 0 ? totalActualHours : (decimal?)null,
                    HoursVariance = hoursVariance != 0 ? hoursVariance : (decimal?)null,
                    TotalMembers = p.UserProjectAssignments.Count,
                    TotalEpics = p.Epics.Count,
                    TeamId = p.TeamId,
                    TeamName = p.Team?.Name ?? "",
                    DepartmentName = p.Team?.Department?.Name,
                    CreatedBy = p.CreatedBy,
                    CreatedByName = p.CreatedByNavigation != null
                        ? $"{p.CreatedByNavigation.FirstName} {p.CreatedByNavigation.LastName}".Trim()
                        : p.CreatedByNavigation?.Username,
                    CreatedAt = p.CreatedAt,
                    ProjectDurationDays = projectDurationDays,
                    DaysRemaining = daysRemaining,
                    IsOverdue = isOverdue
                };
            }).ToList();

            return result;
        }

        public async Task<List<PowerBIUserPerformanceDto>> GetUserPerformanceForExportAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var query = _ctx.Users
                .AsNoTracking()
                .Include(u => u.Department)
                .Include(u => u.TaskAssignmentUsers)
                    .ThenInclude(ta => ta.Task)
                        .ThenInclude(t => t.Project)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.UserId.HasValue)
                    query = query.Where(u => u.Id == filter.UserId.Value);

                if (filter.DepartmentId.HasValue)
                    query = query.Where(u => u.DepartmentId == filter.DepartmentId.Value);
            }

            var users = await query
                .Where(u => u.IsActive ?? true)
                .ToListAsync(ct);

            var now = DateTime.UtcNow;
            var today = now.Date;

            var result = users.Select(u =>
            {
                var allAssignments = u.TaskAssignmentUsers.Where(ta => ta.Task != null).ToList();
                
                if (filter?.ProjectId.HasValue == true)
                    allAssignments = allAssignments.Where(ta => ta.Task!.ProjectId == filter.ProjectId.Value).ToList();

                var tasks = allAssignments.Select(ta => ta.Task!).ToList();
                var totalAssigned = tasks.Count;
                var completed = tasks.Count(t => t.Status == "done");
                var inProgress = tasks.Count(t => t.Status == "in_progress");
                var overdue = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value.Date < today && t.Status != "done");
                var dueToday = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value.Date == today && t.Status != "done");

                var completionRate = totalAssigned > 0
                    ? Math.Round((decimal)completed / totalAssigned * 100, 2)
                    : 0;

                var totalEstimatedHours = tasks.Where(t => t.EstimatedHours.HasValue).Sum(t => t.EstimatedHours!.Value);
                var totalActualHours = tasks.Where(t => t.ActualHours.HasValue).Sum(t => t.ActualHours!.Value);
                var averageHoursPerTask = totalAssigned > 0 && totalActualHours > 0
                    ? (decimal?)Math.Round(totalActualHours / totalAssigned, 2)
                    : (decimal?)null;

                var totalProjects = tasks.Select(t => t.ProjectId).Distinct().Count();
                var lastActivityDate = tasks
                    .Where(t => t.UpdatedAt.HasValue)
                    .OrderByDescending(t => t.UpdatedAt)
                    .FirstOrDefault()?.UpdatedAt;

                return new PowerBIUserPerformanceDto
                {
                    UserId = u.Id,
                    Username = u.Username,
                    FullName = $"{u.FirstName} {u.LastName}".Trim(),
                    Email = u.Email,
                    EmployeeCode = u.EmployeeCode,
                    DepartmentId = u.DepartmentId,
                    DepartmentName = u.Department?.Name,
                    TotalAssignedTasks = totalAssigned,
                    CompletedTasks = completed,
                    InProgressTasks = inProgress,
                    OverdueTasks = overdue,
                    DueTodayTasks = dueToday,
                    CompletionRate = completionRate,
                    TotalEstimatedHours = totalEstimatedHours > 0 ? totalEstimatedHours : (decimal?)null,
                    TotalActualHours = totalActualHours > 0 ? totalActualHours : (decimal?)null,
                    AverageHoursPerTask = averageHoursPerTask,
                    TotalProjects = totalProjects,
                    LastActivityDate = lastActivityDate
                };
            }).ToList();

            return result;
        }

        public async Task<List<PowerBITimeTrackingDto>> GetTimeTrackingForExportAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var query = _ctx.TaskAssignments
                .AsNoTracking()
                .Include(ta => ta.Task)
                    .ThenInclude(t => t.Project)
                .Include(ta => ta.User)
                .Where(ta => ta.Task != null)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.ProjectId.HasValue)
                    query = query.Where(ta => ta.Task!.ProjectId == filter.ProjectId.Value);

                if (filter.UserId.HasValue)
                    query = query.Where(ta => ta.UserId == filter.UserId.Value);

                if (filter.StartDate.HasValue)
                    query = query.Where(ta => ta.Task!.CreatedAt >= filter.StartDate.Value);

                if (filter.EndDate.HasValue)
                    query = query.Where(ta => ta.Task!.CreatedAt <= filter.EndDate.Value);
            }

            var assignments = await query.ToListAsync(ct);

            var result = assignments.Select(ta =>
            {
                var task = ta.Task!;
                var projectCode = task.Project?.Code ?? "";
                var taskKey = !string.IsNullOrEmpty(projectCode) ? $"{projectCode}-{task.Id}" : $"TASK-{task.Id}";
                var estimatedHours = task.EstimatedHours ?? 0;
                var actualHours = task.ActualHours ?? 0;
                var hoursVariance = actualHours - estimatedHours;
                var efficiencyPercentage = estimatedHours > 0
                    ? (decimal?)Math.Round((actualHours / estimatedHours) * 100, 2)
                    : (decimal?)null;

                var completedDate = task.Status == "done" && task.UpdatedAt.HasValue ? task.UpdatedAt : null;
                var daysToComplete = completedDate.HasValue && task.CreatedAt.HasValue
                    ? (int?)(completedDate.Value.Date - task.CreatedAt.Value.Date).TotalDays
                    : null;

                return new PowerBITimeTrackingDto
                {
                    TaskId = task.Id,
                    TaskKey = taskKey,
                    TaskTitle = task.Title ?? "",
                    ProjectId = task.ProjectId,
                    ProjectName = task.Project?.Name ?? "",
                    UserId = ta.UserId,
                    UserName = ta.User != null
                        ? $"{ta.User.FirstName} {ta.User.LastName}".Trim()
                        : ta.User?.Username ?? "",
                    EstimatedHours = estimatedHours > 0 ? estimatedHours : (decimal?)null,
                    ActualHours = actualHours > 0 ? actualHours : (decimal?)null,
                    HoursVariance = hoursVariance != 0 ? hoursVariance : (decimal?)null,
                    EfficiencyPercentage = efficiencyPercentage,
                    Status = task.Status ?? "todo",
                    DueDate = task.DueDate,
                    CompletedDate = completedDate,
                    DaysToComplete = daysToComplete
                };
            }).ToList();

            return result;
        }

        public async Task<byte[]> ExportTasksToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var tasks = await GetTasksForExportAsync(filter, ct);
            return ConvertToCsv(tasks);
        }

        public async Task<byte[]> ExportProjectsToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var projects = await GetProjectsForExportAsync(filter, ct);
            return ConvertToCsv(projects);
        }

        public async Task<byte[]> ExportUserPerformanceToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var users = await GetUserPerformanceForExportAsync(filter, ct);
            return ConvertToCsv(users);
        }

        public async Task<byte[]> ExportTimeTrackingToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var timeTracking = await GetTimeTrackingForExportAsync(filter, ct);
            return ConvertToCsv(timeTracking);
        }

        private byte[] ConvertToCsv<T>(List<T> data)
        {
            if (data == null || !data.Any())
                return Encoding.UTF8.GetBytes("");

            var properties = typeof(T).GetProperties();
            var header = string.Join(",", properties.Select(p => EscapeCsvField(p.Name)));
            var rows = data.Select(item =>
                string.Join(",", properties.Select(p =>
                {
                    var value = p.GetValue(item);
                    if (value == null) return "";
                    
                    // Handle DateTime
                    if (value is DateTime dt)
                        return EscapeCsvField(dt.ToString("yyyy-MM-dd HH:mm:ss"));
                    
                    // Handle nullable DateTime
                    var nullableDateTime = value as DateTime?;
                    if (nullableDateTime.HasValue)
                        return EscapeCsvField(nullableDateTime.Value.ToString("yyyy-MM-dd HH:mm:ss"));
                    
                    // Handle decimal? - return empty if null, otherwise format
                    var nullableDecimal = value as decimal?;
                    if (nullableDecimal.HasValue)
                        return EscapeCsvField(nullableDecimal.Value.ToString(CultureInfo.InvariantCulture));
                    
                    return EscapeCsvField(value.ToString() ?? "");
                }))
            );

            var csv = header + Environment.NewLine + string.Join(Environment.NewLine, rows);
            return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
        }

        private string EscapeCsvField(string? field)
        {
            if (string.IsNullOrEmpty(field))
                return "";

            if (field.Contains(",") || field.Contains("\"") || field.Contains("\n") || field.Contains("\r"))
            {
                return "\"" + field.Replace("\"", "\"\"") + "\"";
            }
            return field;
        }

        private string GetStatusName(string status) => status switch
        {
            "todo" => "Cần làm",
            "in_progress" => "Đang thực hiện",
            "fix" => "Cần sửa",
            "review" => "Đang xem xét",
            "done" => "Đã hoàn thành",
            "blocked" => "Bị chặn",
            _ => status
        };

        public async Task<string> UploadTasksToAzureAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var csvBytes = await ExportTasksToCsvAsync(filter, ct);
            var fileName = $"powerbi/tasks/Tasks_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            
            // Ưu tiên dùng Cloudinary (đã có sẵn)
            if (_cloudinaryService != null)
            {
                using var stream = new MemoryStream(csvBytes);
                var uploadResult = _cloudinaryService.UploadFile(stream, fileName);
                if (uploadResult?.SecureUrl != null)
                    return uploadResult.SecureUrl.ToString();
            }
            
            // Nếu có Azure Blob Service thì dùng
            if (_blobService != null)
            {
                return await _blobService.UploadFileAsync(csvBytes, fileName, "tasks", ct);
            }
            
            throw new InvalidOperationException("Không có storage service được cấu hình. Vui lòng cấu hình Cloudinary hoặc Azure Blob Storage.");
        }

        public async Task<string> UploadProjectsToAzureAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var csvBytes = await ExportProjectsToCsvAsync(filter, ct);
            var fileName = $"powerbi/projects/Projects_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            
            if (_cloudinaryService != null)
            {
                using var stream = new MemoryStream(csvBytes);
                var uploadResult = _cloudinaryService.UploadFile(stream, fileName);
                if (uploadResult?.SecureUrl != null)
                    return uploadResult.SecureUrl.ToString();
            }
            
            if (_blobService != null)
            {
                return await _blobService.UploadFileAsync(csvBytes, fileName, "projects", ct);
            }
            
            throw new InvalidOperationException("Không có storage service được cấu hình. Vui lòng cấu hình Cloudinary hoặc Azure Blob Storage.");
        }

        public async Task<string> UploadUserPerformanceToAzureAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var csvBytes = await ExportUserPerformanceToCsvAsync(filter, ct);
            var fileName = $"powerbi/user-performance/UserPerformance_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            
            if (_cloudinaryService != null)
            {
                using var stream = new MemoryStream(csvBytes);
                var uploadResult = _cloudinaryService.UploadFile(stream, fileName);
                if (uploadResult?.SecureUrl != null)
                    return uploadResult.SecureUrl.ToString();
            }
            
            if (_blobService != null)
            {
                return await _blobService.UploadFileAsync(csvBytes, fileName, "user-performance", ct);
            }
            
            throw new InvalidOperationException("Không có storage service được cấu hình. Vui lòng cấu hình Cloudinary hoặc Azure Blob Storage.");
        }

        public async Task<string> UploadTimeTrackingToAzureAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var csvBytes = await ExportTimeTrackingToCsvAsync(filter, ct);
            var fileName = $"powerbi/time-tracking/TimeTracking_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            
            if (_cloudinaryService != null)
            {
                using var stream = new MemoryStream(csvBytes);
                var uploadResult = _cloudinaryService.UploadFile(stream, fileName);
                if (uploadResult?.SecureUrl != null)
                    return uploadResult.SecureUrl.ToString();
            }
            
            if (_blobService != null)
            {
                return await _blobService.UploadFileAsync(csvBytes, fileName, "time-tracking", ct);
            }
            
            throw new InvalidOperationException("Không có storage service được cấu hình. Vui lòng cấu hình Cloudinary hoặc Azure Blob Storage.");
        }

        public async Task<PowerBIOverviewDto> GetOverviewAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var tasks = await GetTasksForExportAsync(filter, ct);
            var now = DateTime.UtcNow;

            var totalTasks = tasks.Count;
            var inProgressTasks = tasks.Count(t => t.Status == "in_progress" || t.Status == "review" || t.Status == "fix");
            var completedTasks = tasks.Count(t => t.Status == "done");
            var overdueTasks = tasks.Count(t => t.IsOverdue);
            var completionRate = totalTasks > 0
                ? Math.Round((decimal)completedTasks / totalTasks * 100, 2)
                : 0;

            return new PowerBIOverviewDto
            {
                TotalTasks = totalTasks,
                InProgressTasks = inProgressTasks,
                CompletedTasks = completedTasks,
                OverdueTasks = overdueTasks,
                CompletionRate = completionRate,
                ReportDate = now
            };
        }

        public async Task<List<PowerBITaskProgressDto>> GetTaskProgressAsync(PowerBIExportFilterDto? filter = null, string periodType = "day", CancellationToken ct = default)
        {
            var tasks = await GetTasksForExportAsync(filter, ct);
            var now = DateTime.UtcNow;
            var startDate = filter?.StartDate ?? tasks.Min(t => t.CreatedAt) ?? now.AddDays(-30);
            var endDate = filter?.EndDate ?? now;

            var result = new List<PowerBITaskProgressDto>();
            var currentDate = startDate.Date;

            while (currentDate <= endDate.Date)
            {
                string dateKey;
                DateTime nextDate;
                DateTime? weekStart = null;

                if (periodType == "week")
                {
                    weekStart = currentDate.AddDays(-(int)currentDate.DayOfWeek);
                    dateKey = weekStart.Value.ToString("yyyy-MM-dd");
                    nextDate = weekStart.Value.AddDays(7);
                }
                else if (periodType == "month")
                {
                    var monthStart = new DateTime(currentDate.Year, currentDate.Month, 1);
                    dateKey = monthStart.ToString("yyyy-MM");
                    nextDate = monthStart.AddMonths(1);
                }
                else // day
                {
                    dateKey = currentDate.ToString("yyyy-MM-dd");
                    nextDate = currentDate.AddDays(1);
                }

                var createdTasks = tasks.Count(t => t.CreatedAt.HasValue && 
                    (periodType == "week" && weekStart.HasValue ? IsInWeek(t.CreatedAt.Value, weekStart.Value) :
                     periodType == "month" ? t.CreatedAt.Value.Year == currentDate.Year && t.CreatedAt.Value.Month == currentDate.Month :
                     t.CreatedAt.Value.Date == currentDate));

                var completedTasks = tasks.Count(t => t.Status == "done" && t.UpdatedAt.HasValue &&
                    (periodType == "week" && weekStart.HasValue ? IsInWeek(t.UpdatedAt.Value, weekStart.Value) :
                     periodType == "month" ? t.UpdatedAt.Value.Year == currentDate.Year && t.UpdatedAt.Value.Month == currentDate.Month :
                     t.UpdatedAt.Value.Date == currentDate));

                result.Add(new PowerBITaskProgressDto
                {
                    Date = currentDate,
                    DateKey = dateKey,
                    CreatedTasks = createdTasks,
                    CompletedTasks = completedTasks,
                    NetTasks = createdTasks - completedTasks,
                    PeriodType = periodType
                });

                currentDate = nextDate;
            }

            return result;
        }

        private bool IsInWeek(DateTime date, DateTime weekStart)
        {
            return date.Date >= weekStart.Date && date.Date < weekStart.AddDays(7).Date;
        }

        public async Task<List<PowerBIOverdueRiskDto>> GetOverdueRisksAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var tasks = await GetTasksForExportAsync(filter, ct);
            var today = DateTime.UtcNow.Date;

            var result = tasks
                .Where(t => t.DueDate.HasValue && t.Status != "done")
                .Select(t =>
                {
                    var dueDate = t.DueDate!.Value.Date;
                    var daysOverdue = (today - dueDate).Days;
                    var daysUntilDue = (dueDate - today).Days;
                    var isOverdue = daysOverdue > 0;
                    var isDueSoon = !isOverdue && daysUntilDue >= 0 && daysUntilDue <= 7;

                    return new PowerBIOverdueRiskDto
                    {
                        TaskId = t.TaskId,
                        TaskKey = t.TaskKey,
                        Title = t.Title,
                        ProjectId = t.ProjectId,
                        ProjectName = t.ProjectName,
                        ProjectCode = t.ProjectCode,
                        DueDate = t.DueDate,
                        DaysOverdue = isOverdue ? daysOverdue : 0,
                        DaysUntilDue = daysUntilDue,
                        IsOverdue = isOverdue,
                        IsDueSoon = isDueSoon,
                        Priority = t.Priority,
                        Status = t.Status,
                        AssigneeNames = t.AssigneeNames,
                        TeamName = t.TeamName,
                        DepartmentName = t.DepartmentName
                    };
                })
                .OrderByDescending(t => t.IsOverdue)
                .ThenBy(t => t.DaysUntilDue)
                .ToList();

            return result;
        }

        public async Task<List<PowerBIWorkloadDto>> GetWorkloadDistributionAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var tasks = await GetTasksForExportAsync(filter, ct);
            var today = DateTime.UtcNow.Date;

            var userGroups = tasks
                .Where(t => !string.IsNullOrEmpty(t.AssigneeIds))
                .SelectMany(t => t.AssigneeIds!.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(userId => new
                    {
                        UserId = long.TryParse(userId.Trim(), out var id) ? id : 0,
                        Task = t
                    }))
                .Where(x => x.UserId > 0)
                .GroupBy(x => x.UserId)
                .ToList();

            var userPerformance = await GetUserPerformanceForExportAsync(filter, ct);
            var userDict = userPerformance.ToDictionary(u => u.UserId);

            var result = userGroups.Select(g =>
            {
                var userId = g.Key;
                var userTasks = g.Select(x => x.Task).ToList();
                var user = userDict.ContainsKey(userId) ? userDict[userId] : null;

                var totalTasks = userTasks.Count;
                var highPriority = userTasks.Count(t => t.Priority == "high");
                var mediumPriority = userTasks.Count(t => t.Priority == "medium");
                var lowPriority = userTasks.Count(t => t.Priority == "low");
                var todo = userTasks.Count(t => t.Status == "todo");
                var inProgress = userTasks.Count(t => t.Status == "in_progress");
                var review = userTasks.Count(t => t.Status == "review");
                var done = userTasks.Count(t => t.Status == "done");
                var overdue = userTasks.Count(t => t.IsOverdue);

                var totalEstimated = userTasks.Where(t => t.EstimatedHours.HasValue).Sum(t => t.EstimatedHours!.Value);
                var totalActual = userTasks.Where(t => t.ActualHours.HasValue).Sum(t => t.ActualHours!.Value);

                // Calculate workload percentage vs team average
                var teamAverage = userGroups.Any() ? userGroups.Average(ug => ug.Count()) : 0;
                var workloadPercentage = teamAverage > 0
                    ? Math.Round((decimal)(totalTasks / teamAverage) * 100, 2)
                    : 100;

                return new PowerBIWorkloadDto
                {
                    UserId = userId,
                    UserName = user?.Username ?? $"User_{userId}",
                    FullName = user?.FullName,
                    DepartmentName = user?.DepartmentName,
                    TotalTasks = totalTasks,
                    HighPriorityTasks = highPriority,
                    MediumPriorityTasks = mediumPriority,
                    LowPriorityTasks = lowPriority,
                    TodoTasks = todo,
                    InProgressTasks = inProgress,
                    ReviewTasks = review,
                    DoneTasks = done,
                    TotalEstimatedHours = totalEstimated > 0 ? totalEstimated : (decimal?)null,
                    TotalActualHours = totalActual > 0 ? totalActual : (decimal?)null,
                    OverdueTasks = overdue,
                    WorkloadPercentage = workloadPercentage
                };
            }).ToList();

            return result;
        }

        public async Task<List<PowerBIBottleneckDto>> GetBottlenecksAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var tasks = await GetTasksForExportAsync(filter, ct);
            var now = DateTime.UtcNow;

            // Get task history for reopen count and status changes
            // Note: This is a simplified version. In a real system, you'd query task history/audit logs
            var result = tasks
                .Where(t => t.Status != "done" && (t.Status == "blocked" || t.Status == "review" || 
                    (t.UpdatedAt.HasValue && (now - t.UpdatedAt.Value).TotalDays > 7)))
                .Select(t =>
                {
                    var daysInStatus = t.UpdatedAt.HasValue
                        ? (int)(now.Date - t.UpdatedAt.Value.Date).TotalDays
                        : t.CreatedAt.HasValue
                            ? (int)(now.Date - t.CreatedAt.Value.Date).TotalDays
                            : 0;

                    return new PowerBIBottleneckDto
                    {
                        TaskId = t.TaskId,
                        TaskKey = t.TaskKey,
                        Title = t.Title,
                        ProjectId = t.ProjectId,
                        ProjectName = t.ProjectName,
                        Status = t.Status,
                        CreatedAt = t.CreatedAt,
                        UpdatedAt = t.UpdatedAt,
                        DueDate = t.DueDate,
                        DaysInStatus = daysInStatus,
                        ReopenCount = 0, // Would need task history to calculate
                        StatusChangeCount = 0, // Would need task history to calculate
                        IsBlocked = t.Status == "blocked",
                        IsWaitingApproval = t.Status == "review",
                        BlockedReason = t.Status == "blocked" ? "Blocked" : null,
                        AssigneeNames = t.AssigneeNames,
                        Priority = t.Priority
                    };
                })
                .OrderByDescending(t => t.DaysInStatus)
                .ThenByDescending(t => t.IsBlocked)
                .ToList();

            return result;
        }

        public async Task<List<PowerBISLADto>> GetSLAComplianceAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var tasks = await GetTasksForExportAsync(filter, ct);
            var today = DateTime.UtcNow.Date;

            var result = tasks
                .Where(t => t.DueDate.HasValue)
                .Select(t =>
                {
                    var dueDate = t.DueDate!.Value.Date;
                    var completedOnTime = t.Status == "done" && t.UpdatedAt.HasValue && t.UpdatedAt.Value.Date <= dueDate;
                    var daysToComplete = t.Status == "done" && t.CreatedAt.HasValue && t.UpdatedAt.HasValue
                        ? (int?)(t.UpdatedAt.Value.Date - t.CreatedAt.Value.Date).TotalDays
                        : null;
                    var daysOverdue = t.Status != "done" && dueDate < today
                        ? (int?)(today - dueDate).TotalDays
                        : null;

                    return new PowerBISLADto
                    {
                        TaskId = t.TaskId,
                        TaskKey = t.TaskKey,
                        Title = t.Title,
                        ProjectId = t.ProjectId,
                        ProjectName = t.ProjectName,
                        CreatedAt = t.CreatedAt,
                        DueDate = t.DueDate,
                        CompletedDate = t.Status == "done" ? t.UpdatedAt : null,
                        CompletedOnTime = completedOnTime,
                        DaysToComplete = daysToComplete,
                        DaysOverdue = daysOverdue,
                        EstimatedHours = t.EstimatedHours,
                        ActualHours = t.ActualHours,
                        Status = t.Status,
                        Priority = t.Priority,
                        AssigneeNames = t.AssigneeNames,
                        TeamName = t.TeamName,
                        DepartmentName = t.DepartmentName
                    };
                })
                .ToList();

            return result;
        }

        public async Task<List<PowerBIProjectComparisonDto>> GetProjectComparisonAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var projects = await GetProjectsForExportAsync(filter, ct);
            var tasks = await GetTasksForExportAsync(filter, ct);

            var result = projects.Select(p =>
            {
                var projectTasks = tasks.Where(t => t.ProjectId == p.ProjectId).ToList();
                var completedTasks = projectTasks.Where(t => t.Status == "done").ToList();
                var overdueTasks = projectTasks.Where(t => t.IsOverdue).ToList();
                
                var onTimeCompleted = completedTasks.Count(t => 
                    t.DueDate.HasValue && t.UpdatedAt.HasValue && t.UpdatedAt.Value.Date <= t.DueDate.Value.Date);
                var onTimeCompletionRate = completedTasks.Count > 0
                    ? Math.Round((decimal)onTimeCompleted / completedTasks.Count * 100, 2)
                    : 0;

                var avgDaysToComplete = completedTasks
                    .Where(t => t.CreatedAt.HasValue && t.UpdatedAt.HasValue)
                    .Select(t => (t.UpdatedAt!.Value.Date - t.CreatedAt!.Value.Date).TotalDays)
                    .DefaultIfEmpty(0)
                    .Average();

                var totalEstimated = projectTasks.Where(t => t.EstimatedHours.HasValue).Sum(t => t.EstimatedHours!.Value);
                var totalActual = projectTasks.Where(t => t.ActualHours.HasValue).Sum(t => t.ActualHours!.Value);
                var efficiencyPercentage = totalEstimated > 0
                    ? (decimal?)Math.Round((totalActual / totalEstimated) * 100, 2)
                    : null;

                return new PowerBIProjectComparisonDto
                {
                    ProjectId = p.ProjectId,
                    ProjectName = p.ProjectName,
                    ProjectCode = p.ProjectCode,
                    Status = p.Status,
                    TotalTasks = p.TotalTasks,
                    CompletedTasks = p.DoneTasks,
                    OverdueTasks = p.OverdueTasks,
                    CompletionRate = p.CompletionPercentage,
                    OnTimeCompletionRate = onTimeCompletionRate,
                    AverageDaysToComplete = avgDaysToComplete > 0 ? (decimal?)Math.Round((decimal)avgDaysToComplete, 2) : null,
                    TotalMembers = p.TotalMembers,
                    TotalEstimatedHours = totalEstimated > 0 ? totalEstimated : (decimal?)null,
                    TotalActualHours = totalActual > 0 ? totalActual : (decimal?)null,
                    EfficiencyPercentage = efficiencyPercentage,
                    TeamName = p.TeamName,
                    DepartmentName = p.DepartmentName,
                    StartDate = p.StartDate,
                    DueDate = p.DueDate,
                    IsOverdue = p.IsOverdue
                };
            })
            .OrderByDescending(p => p.OverdueTasks)
            .ThenByDescending(p => p.CompletionRate)
            .ToList();

            return result;
        }

        // Export report methods to CSV
        public async Task<byte[]> ExportOverviewToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var overview = await GetOverviewAsync(filter, ct);
            // Convert single object to list for CSV export
            var list = new List<PowerBIOverviewDto> { overview };
            return ConvertToCsv(list);
        }

        public async Task<byte[]> ExportTaskProgressToCsvAsync(PowerBIExportFilterDto? filter = null, string periodType = "day", CancellationToken ct = default)
        {
            var data = await GetTaskProgressAsync(filter, periodType, ct);
            return ConvertToCsv(data);
        }

        public async Task<byte[]> ExportOverdueRisksToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetOverdueRisksAsync(filter, ct);
            return ConvertToCsv(data);
        }

        public async Task<byte[]> ExportWorkloadDistributionToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetWorkloadDistributionAsync(filter, ct);
            return ConvertToCsv(data);
        }

        public async Task<byte[]> ExportBottlenecksToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetBottlenecksAsync(filter, ct);
            return ConvertToCsv(data);
        }

        public async Task<byte[]> ExportSLAComplianceToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetSLAComplianceAsync(filter, ct);
            return ConvertToCsv(data);
        }

        public async Task<byte[]> ExportProjectComparisonToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetProjectComparisonAsync(filter, ct);
            return ConvertToCsv(data);
        }

        // Excel Export Methods
        public async Task<byte[]> ExportTasksToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetTasksForExportAsync(filter, ct);
            return ConvertToExcel(data, "Tasks");
        }

        public async Task<byte[]> ExportProjectsToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetProjectsForExportAsync(filter, ct);
            return ConvertToExcel(data, "Projects");
        }

        public async Task<byte[]> ExportUserPerformanceToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetUserPerformanceForExportAsync(filter, ct);
            return ConvertToExcel(data, "UserPerformance");
        }

        public async Task<byte[]> ExportTimeTrackingToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetTimeTrackingForExportAsync(filter, ct);
            return ConvertToExcel(data, "TimeTracking");
        }

        public async Task<byte[]> ExportOverviewToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var overview = await GetOverviewAsync(filter, ct);
            var list = new List<PowerBIOverviewDto> { overview };
            return ConvertToExcel(list, "Overview");
        }

        public async Task<byte[]> ExportTaskProgressToExcelAsync(PowerBIExportFilterDto? filter = null, string periodType = "day", CancellationToken ct = default)
        {
            var data = await GetTaskProgressAsync(filter, periodType, ct);
            return ConvertToExcel(data, "TaskProgress");
        }

        public async Task<byte[]> ExportOverdueRisksToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetOverdueRisksAsync(filter, ct);
            return ConvertToExcel(data, "OverdueRisks");
        }

        public async Task<byte[]> ExportWorkloadDistributionToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetWorkloadDistributionAsync(filter, ct);
            return ConvertToExcel(data, "WorkloadDistribution");
        }

        public async Task<byte[]> ExportBottlenecksToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetBottlenecksAsync(filter, ct);
            return ConvertToExcel(data, "Bottlenecks");
        }

        public async Task<byte[]> ExportSLAComplianceToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetSLAComplianceAsync(filter, ct);
            return ConvertToExcel(data, "SLACompliance");
        }

        public async Task<byte[]> ExportProjectComparisonToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetProjectComparisonAsync(filter, ct);
            return ConvertToExcel(data, "ProjectComparison");
        }

        // ========== Phase 1: Advanced Metrics APIs ==========

        /// <summary>
        /// Lấy Communication & Collaboration Metrics
        /// </summary>
        public async Task<List<PowerBICommunicationMetricsDto>> GetCommunicationMetricsAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var query = _ctx.Tasks
                .AsNoTracking()
                .Include(t => t.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Department)
                .Include(t => t.TaskComments)
                    .ThenInclude(c => c.User)
                .Include(t => t.TaskFiles)
                .Include(t => t.TaskImages)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.ProjectId.HasValue)
                    query = query.Where(t => t.ProjectId == filter.ProjectId.Value);
                if (filter.UserId.HasValue)
                    query = query.Where(t => t.TaskAssignments.Any(ta => ta.UserId == filter.UserId.Value));
                if (filter.DepartmentId.HasValue)
                    query = query.Where(t => t.Project.Team.DepartmentId == filter.DepartmentId.Value);
                if (filter.TeamId.HasValue)
                    query = query.Where(t => t.Project.TeamId == filter.TeamId.Value);
                if (filter.StartDate.HasValue)
                    query = query.Where(t => t.CreatedAt >= filter.StartDate.Value);
                if (filter.EndDate.HasValue)
                    query = query.Where(t => t.CreatedAt <= filter.EndDate.Value);
            }

            var tasks = await query.ToListAsync(ct);
            var now = DateTime.UtcNow;

            var result = tasks.Select(t =>
            {
                var comments = t.TaskComments.ToList();
                var firstComment = comments.OrderBy(c => c.CreatedAt).FirstOrDefault();
                var lastComment = comments.OrderByDescending(c => c.CreatedAt).FirstOrDefault();
                var uniqueContributors = comments.Select(c => c.UserId).Distinct().Count();
                var replies = comments.Count(c => c.ParentCommentId.HasValue);
                var reviews = comments.Count(c => c.IsReview == true);
                var ratings = comments.Where(c => c.Rating.HasValue).Select(c => (decimal)c.Rating!.Value).ToList();
                var avgRating = ratings.Any() ? (decimal?)ratings.Average() : null;

                // Calculate average response time (time between first comment and first reply)
                decimal? avgResponseTimeHours = null;
                if (comments.Count > 1)
                {
                    var responseTimes = new List<decimal>();
                    foreach (var comment in comments.Where(c => c.ParentCommentId.HasValue))
                    {
                        var parent = comments.FirstOrDefault(c => c.Id == comment.ParentCommentId);
                        if (parent != null && parent.CreatedAt.HasValue && comment.CreatedAt.HasValue)
                        {
                            var hours = (decimal)(comment.CreatedAt.Value - parent.CreatedAt.Value).TotalHours;
                            if (hours > 0) responseTimes.Add(hours);
                        }
                    }
                    if (responseTimes.Any())
                        avgResponseTimeHours = responseTimes.Average();
                }

                return new PowerBICommunicationMetricsDto
                {
                    TaskId = t.Id,
                    TaskKey = $"{t.Project?.Code}-{t.Id}",
                    TaskTitle = t.Title,
                    ProjectId = t.ProjectId,
                    ProjectName = t.Project?.Name ?? "",
                    TotalComments = comments.Count,
                    TotalReplies = replies,
                    UniqueContributors = uniqueContributors,
                    AverageResponseTimeHours = avgResponseTimeHours,
                    TotalFiles = t.TaskFiles.Count,
                    TotalImages = t.TaskImages.Count + comments.Sum(c => c.TaskCommentImages.Count),
                    ReviewCount = reviews,
                    AverageRating = avgRating,
                    FirstCommentDate = firstComment?.CreatedAt,
                    LastCommentDate = lastComment?.CreatedAt,
                    DaysSinceLastComment = lastComment?.CreatedAt.HasValue == true 
                        ? (int?)(now.Date - lastComment.CreatedAt.Value.Date).TotalDays 
                        : null,
                    TeamName = t.Project?.Team?.Name,
                    DepartmentName = t.Project?.Team?.Department?.Name
                };
            }).ToList();

            return result;
        }

        /// <summary>
        /// Lấy Task Lifecycle & Velocity Metrics
        /// </summary>
        public async Task<List<PowerBITaskLifecycleDto>> GetTaskLifecycleMetricsAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var query = _ctx.Tasks
                .AsNoTracking()
                .Include(t => t.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Department)
                .Include(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
                .Include(t => t.TaskHistories)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.ProjectId.HasValue)
                    query = query.Where(t => t.ProjectId == filter.ProjectId.Value);
                if (filter.UserId.HasValue)
                    query = query.Where(t => t.TaskAssignments.Any(ta => ta.UserId == filter.UserId.Value));
                if (filter.DepartmentId.HasValue)
                    query = query.Where(t => t.Project.Team.DepartmentId == filter.DepartmentId.Value);
                if (filter.TeamId.HasValue)
                    query = query.Where(t => t.Project.TeamId == filter.TeamId.Value);
                if (filter.StartDate.HasValue)
                    query = query.Where(t => t.CreatedAt >= filter.StartDate.Value);
                if (filter.EndDate.HasValue)
                    query = query.Where(t => t.CreatedAt <= filter.EndDate.Value);
            }

            var tasks = await query.ToListAsync(ct);

            var result = tasks.Select(t =>
            {
                var histories = t.TaskHistories.OrderBy(h => h.ChangedAt).ToList();
                var statusHistories = histories.Where(h => h.FieldName == "Status").ToList();
                
                // Find first assignment
                var firstAssignment = t.TaskAssignments.OrderBy(ta => ta.AssignedAt).FirstOrDefault();
                var firstAssignedAt = firstAssignment?.AssignedAt;

                // Find when task started (moved to in_progress)
                var startedHistory = statusHistories.FirstOrDefault(h => h.NewValue?.ToLower() == "in_progress");
                var startedAt = startedHistory?.ChangedAt;

                // Find when task completed
                var completedHistory = statusHistories.LastOrDefault(h => h.NewValue?.ToLower() == "done");
                var completedAt = completedHistory?.ChangedAt ?? (t.Status?.ToLower() == "done" ? t.UpdatedAt : null);

                // Calculate time in each status
                var timeInStatus = new Dictionary<string, int>();
                DateTime? lastStatusChange = t.CreatedAt;
                string? lastStatus = "todo";

                foreach (var history in statusHistories)
                {
                    if (lastStatusChange.HasValue && history.ChangedAt.HasValue)
                    {
                        var days = (int)(history.ChangedAt.Value.Date - lastStatusChange.Value.Date).TotalDays;
                        if (days > 0)
                        {
                            if (!timeInStatus.ContainsKey(lastStatus ?? "unknown"))
                                timeInStatus[lastStatus ?? "unknown"] = 0;
                            timeInStatus[lastStatus ?? "unknown"] += days;
                        }
                    }
                    lastStatus = history.NewValue?.ToLower();
                    lastStatusChange = history.ChangedAt;
                }

                // Add remaining time in current status
                if (lastStatusChange.HasValue && !completedAt.HasValue)
                {
                    var days = (int)(DateTime.UtcNow.Date - lastStatusChange.Value.Date).TotalDays;
                    if (days > 0)
                    {
                        if (!timeInStatus.ContainsKey(lastStatus ?? "unknown"))
                            timeInStatus[lastStatus ?? "unknown"] = 0;
                        timeInStatus[lastStatus ?? "unknown"] += days;
                    }
                }

                // Calculate cycle time and lead time
                int? cycleTimeDays = null;
                if (t.CreatedAt.HasValue && completedAt.HasValue)
                    cycleTimeDays = (int)(completedAt.Value.Date - t.CreatedAt.Value.Date).TotalDays;

                int? leadTimeDays = null;
                if (firstAssignedAt.HasValue && completedAt.HasValue)
                    leadTimeDays = (int)(completedAt.Value.Date - firstAssignedAt.Value.Date).TotalDays;

                // Count status changes and reopens
                var statusChangeCount = statusHistories.Count;
                var reopenCount = statusHistories.Count(h => h.OldValue?.ToLower() == "done" && h.NewValue?.ToLower() != "done");

                return new PowerBITaskLifecycleDto
                {
                    TaskId = t.Id,
                    TaskKey = $"{t.Project?.Code}-{t.Id}",
                    TaskTitle = t.Title,
                    ProjectId = t.ProjectId,
                    ProjectName = t.Project?.Name ?? "",
                    CreatedAt = t.CreatedAt,
                    FirstAssignedAt = firstAssignedAt,
                    StartedAt = startedAt,
                    CompletedAt = completedAt,
                    CycleTimeDays = cycleTimeDays,
                    LeadTimeDays = leadTimeDays,
                    TimeInTodoDays = timeInStatus.GetValueOrDefault("todo"),
                    TimeInProgressDays = timeInStatus.GetValueOrDefault("in_progress"),
                    TimeInReviewDays = timeInStatus.GetValueOrDefault("review"),
                    TimeInFixDays = timeInStatus.GetValueOrDefault("fix"),
                    StatusChangeCount = statusChangeCount,
                    ReopenCount = reopenCount,
                    Status = t.Status ?? "todo",
                    Priority = t.Priority ?? "medium",
                    AssigneeNames = string.Join(", ", t.TaskAssignments.Select(ta => ta.User?.FirstName + " " + ta.User?.LastName).Where(n => !string.IsNullOrEmpty(n))),
                    TeamName = t.Project?.Team?.Name,
                    DepartmentName = t.Project?.Team?.Department?.Name
                };
            }).ToList();

            return result;
        }

        /// <summary>
        /// Lấy Sprint & Agile Metrics
        /// </summary>
        public async Task<List<PowerBISprintMetricsDto>> GetSprintMetricsAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var query = _ctx.Sprints
                .AsNoTracking()
                .Include(s => s.Board)
                    .ThenInclude(b => b.Project)
                        .ThenInclude(p => p.Team)
                            .ThenInclude(t => t.Department)
                .Include(s => s.Board)
                    .ThenInclude(b => b.Project)
                        .ThenInclude(p => p.Tasks)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.ProjectId.HasValue)
                    query = query.Where(s => s.Board.ProjectId == filter.ProjectId.Value);
                if (filter.DepartmentId.HasValue)
                    query = query.Where(s => s.Board.Project.Team.DepartmentId == filter.DepartmentId.Value);
                if (filter.TeamId.HasValue)
                    query = query.Where(s => s.Board.Project.TeamId == filter.TeamId.Value);
                if (filter.StartDate.HasValue)
                    query = query.Where(s => s.StartDate >= filter.StartDate.Value);
                if (filter.EndDate.HasValue)
                    query = query.Where(s => s.EndDate <= filter.EndDate.Value);
            }

            var sprints = await query.ToListAsync(ct);
            var now = DateTime.UtcNow;

            var result = sprints.Select(s =>
            {
                // Get tasks in this sprint (via SprintTasks)
                var sprintTasks = _ctx.SprintTasks
                    .AsNoTracking()
                    .Where(st => st.SprintId == s.Id)
                    .Include(st => st.Task)
                    .ToList()
                    .Select(st => st.Task)
                    .ToList();

                var totalTasks = sprintTasks.Count;
                var completedTasks = sprintTasks.Count(t => t.Status?.ToLower() == "done");
                var inProgressTasks = sprintTasks.Count(t => t.Status?.ToLower() == "in_progress");
                var todoTasks = sprintTasks.Count(t => t.Status?.ToLower() == "todo" || string.IsNullOrEmpty(t.Status));

                var completionRate = totalTasks > 0 ? Math.Round((decimal)completedTasks / totalTasks * 100, 2) : 0;
                var velocity = (decimal?)completedTasks; // Can be enhanced with story points if available

                var isActive = s.Status?.ToLower() == "active";
                var isCompleted = s.Status?.ToLower() == "completed" || s.CompletedDate.HasValue;
                var goalAchieved = isCompleted && completionRate >= 80; // 80% threshold

                int? daysRemaining = null;
                if (s.StartDate.HasValue && s.EndDate.HasValue && isActive)
                {
                    var totalDays = (s.EndDate.Value.Date - s.StartDate.Value.Date).TotalDays;
                    var daysPassed = (now.Date - s.StartDate.Value.Date).TotalDays;
                    daysRemaining = Math.Max(0, (int)(totalDays - daysPassed));
                }

                return new PowerBISprintMetricsDto
                {
                    SprintId = s.Id,
                    SprintName = s.Name,
                    BoardId = s.BoardId,
                    ProjectId = s.Board.ProjectId,
                    ProjectName = s.Board.Project?.Name ?? "",
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    CompletedDate = s.CompletedDate,
                    Status = s.Status ?? "planned",
                    TotalTasks = totalTasks,
                    CompletedTasks = completedTasks,
                    InProgressTasks = inProgressTasks,
                    TodoTasks = todoTasks,
                    CompletionRate = completionRate,
                    Velocity = velocity,
                    DaysRemaining = daysRemaining,
                    IsActive = isActive,
                    IsCompleted = isCompleted,
                    GoalAchieved = goalAchieved,
                    TeamName = s.Board.Project?.Team?.Name,
                    DepartmentName = s.Board.Project?.Team?.Department?.Name
                };
            }).ToList();

            return result;
        }

        /// <summary>
        /// Lấy Sprint Burndown Data
        /// </summary>
        public async Task<List<PowerBISprintBurndownDto>> GetSprintBurndownAsync(long sprintId, CancellationToken ct = default)
        {
            var sprint = await _ctx.Sprints
                .AsNoTracking()
                .Include(s => s.Board)
                .FirstOrDefaultAsync(s => s.Id == sprintId, ct);

            if (sprint == null || !sprint.StartDate.HasValue || !sprint.EndDate.HasValue)
                return new List<PowerBISprintBurndownDto>();

            var sprintTasks = await _ctx.SprintTasks
                .AsNoTracking()
                .Where(st => st.SprintId == sprintId)
                .Include(st => st.Task)
                .ToListAsync(ct);

            var tasks = sprintTasks.Select(st => st.Task).ToList();
            var totalTasks = tasks.Count;
            var totalHours = tasks.Where(t => t.EstimatedHours.HasValue).Sum(t => t.EstimatedHours!.Value);

            var startDate = sprint.StartDate.Value.Date;
            var endDate = sprint.EndDate.Value.Date;
            var totalDays = (endDate - startDate).TotalDays + 1;

            var result = new List<PowerBISprintBurndownDto>();
            var currentDate = startDate;

            while (currentDate <= endDate && currentDate <= DateTime.UtcNow.Date)
            {
                var completedByDate = tasks.Count(t => 
                    t.Status?.ToLower() == "done" && 
                    t.UpdatedAt.HasValue && 
                    t.UpdatedAt.Value.Date <= currentDate);

                var remainingTasks = totalTasks - completedByDate;

                var completedHours = tasks
                    .Where(t => t.Status?.ToLower() == "done" && t.UpdatedAt.HasValue && t.UpdatedAt.Value.Date <= currentDate)
                    .Sum(t => t.EstimatedHours ?? 0);

                var remainingHours = totalHours - completedHours;

                result.Add(new PowerBISprintBurndownDto
                {
                    SprintId = sprintId,
                    SprintName = sprint.Name,
                    Date = currentDate,
                    DateKey = currentDate.ToString("yyyy-MM-dd"),
                    RemainingTasks = remainingTasks,
                    CompletedTasks = completedByDate,
                    TotalTasks = totalTasks,
                    RemainingHours = remainingHours > 0 ? (decimal?)remainingHours : null,
                    CompletedHours = completedHours > 0 ? (decimal?)completedHours : null,
                    TotalHours = totalHours > 0 ? (decimal?)totalHours : null,
                    DaysIntoSprint = (int)(currentDate - startDate).TotalDays + 1,
                    TotalSprintDays = (int)totalDays
                });

                currentDate = currentDate.AddDays(1);
            }

            return result;
        }

        // Export methods for new metrics
        public async Task<byte[]> ExportCommunicationMetricsToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetCommunicationMetricsAsync(filter, ct);
            return ConvertToCsv(data);
        }

        public async Task<byte[]> ExportTaskLifecycleToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetTaskLifecycleMetricsAsync(filter, ct);
            return ConvertToCsv(data);
        }

        public async Task<byte[]> ExportSprintMetricsToCsvAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetSprintMetricsAsync(filter, ct);
            return ConvertToCsv(data);
        }

        public async Task<byte[]> ExportCommunicationMetricsToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetCommunicationMetricsAsync(filter, ct);
            return ConvertToExcel(data, "CommunicationMetrics");
        }

        public async Task<byte[]> ExportTaskLifecycleToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetTaskLifecycleMetricsAsync(filter, ct);
            return ConvertToExcel(data, "TaskLifecycle");
        }

        public async Task<byte[]> ExportSprintMetricsToExcelAsync(PowerBIExportFilterDto? filter = null, CancellationToken ct = default)
        {
            var data = await GetSprintMetricsAsync(filter, ct);
            return ConvertToExcel(data, "SprintMetrics");
        }

        private byte[] ConvertToExcel<T>(List<T> data, string sheetName)
        {
            ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;
            
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add(sheetName);

            if (data == null || !data.Any())
            {
                worksheet.Cells[1, 1].Value = "No data available";
                return package.GetAsByteArray();
            }

            var properties = typeof(T).GetProperties();
            
            // Write headers
            for (int col = 0; col < properties.Length; col++)
            {
                worksheet.Cells[1, col + 1].Value = properties[col].Name;
                worksheet.Cells[1, col + 1].Style.Font.Bold = true;
                worksheet.Cells[1, col + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                worksheet.Cells[1, col + 1].Style.Fill.BackgroundColor.SetColor(Color.LightGray);
            }

            // Write data
            for (int row = 0; row < data.Count; row++)
            {
                var item = data[row];
                for (int col = 0; col < properties.Length; col++)
                {
                    var value = properties[col].GetValue(item);
                    if (value == null)
                    {
                        worksheet.Cells[row + 2, col + 1].Value = "";
                    }
                    else if (value is DateTime dt)
                    {
                        worksheet.Cells[row + 2, col + 1].Value = dt;
                        worksheet.Cells[row + 2, col + 1].Style.Numberformat.Format = "yyyy-mm-dd hh:mm:ss";
                    }
                    else
                    {
                        var nullableDateTime = value as DateTime?;
                        if (nullableDateTime.HasValue)
                        {
                            worksheet.Cells[row + 2, col + 1].Value = nullableDateTime.Value;
                            worksheet.Cells[row + 2, col + 1].Style.Numberformat.Format = "yyyy-mm-dd hh:mm:ss";
                        }
                        else if (value is decimal || value is decimal?)
                        {
                            worksheet.Cells[row + 2, col + 1].Value = value;
                            worksheet.Cells[row + 2, col + 1].Style.Numberformat.Format = "#,##0.00";
                        }
                        else
                        {
                            worksheet.Cells[row + 2, col + 1].Value = value.ToString();
                        }
                    }
                }
            }

            // Auto-fit columns
            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

            return package.GetAsByteArray();
        }
    }
}
