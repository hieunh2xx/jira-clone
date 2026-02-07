using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Linq;
namespace ManagementProject.Services;
public class DashboardService : IDashboardService
{
    private readonly ProjectManagementDbContext _ctx;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public DashboardService(ProjectManagementDbContext ctx, IHttpContextAccessor httpContextAccessor)
    {
        _ctx = ctx;
        _httpContextAccessor = httpContextAccessor;
    }
    public async Task<ProjectProgressDto> GetProjectProgressAsync(long projectId, CancellationToken ct = default)
    {
        var project = await _ctx.Projects
            .Include(p => p.Tasks)
                .ThenInclude(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy dự án");
        var tasks = project.Tasks.ToList();
        var now = DateTime.UtcNow;
        var today = now.Date;
        var todoTasks = tasks.Count(t => t.Status == "todo");
        var inProgressTasks = tasks.Count(t => t.Status == "in_progress");
        var fixTasks = tasks.Count(t => t.Status == "fix");
        var reviewTasks = tasks.Count(t => t.Status == "review");
        var doneTasks = tasks.Count(t => t.Status == "done");
        var blockedTasks = tasks.Count(t => t.Status == "blocked");
        var totalTasks = tasks.Count;
        var overdueTasks = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != "done");
        var completionPercentage = totalTasks > 0 
            ? Math.Round((decimal)doneTasks / totalTasks * 100, 2) 
            : 0;
        var totalEstimatedHours = tasks.Where(t => t.EstimatedHours.HasValue).Sum(t => t.EstimatedHours!.Value);
        var totalActualHours = tasks.Where(t => t.ActualHours.HasValue).Sum(t => t.ActualHours!.Value);
        var statusBreakdown = new List<StatusCountDto>
        {
            new() { Status = "todo", StatusName = "Cần làm", Count = todoTasks, Color = "#DFE1E6" },
            new() { Status = "in_progress", StatusName = "Đang thực hiện", Count = inProgressTasks, Color = "#3B82F6" },
            new() { Status = "fix", StatusName = "Cần sửa", Count = fixTasks, Color = "#F97316" },
            new() { Status = "review", StatusName = "Đang xem xét", Count = reviewTasks, Color = "#F59E0B" },
            new() { Status = "done", StatusName = "Đã hoàn thành", Count = doneTasks, Color = "#10B981" },
            new() { Status = "blocked", StatusName = "Bị chặn", Count = blockedTasks, Color = "#EF4444" }
        };
        var recentTasks = tasks
            .OrderByDescending(t => t.UpdatedAt ?? t.CreatedAt ?? DateTime.MinValue)
            .Take(10)
            .Select(t => new TaskProgressDto
            {
                TaskId = t.Id,
                TaskKey = $"{project.Code}-{t.Id}",
                Title = t.Title,
                Status = t.Status ?? "todo",
                StatusName = GetStatusName(t.Status ?? "todo"),
                Priority = t.Priority ?? "medium",
                DueDate = t.DueDate,
                IsOverdue = t.DueDate.HasValue && t.DueDate.Value < now && t.Status != "done",
                AssigneeNames = t.TaskAssignments.Select(a => a.User.Username).ToList()
            })
            .ToList();
        return new ProjectProgressDto
        {
            ProjectId = project.Id,
            ProjectName = project.Name,
            ProjectCode = project.Code,
            TotalTasks = totalTasks,
            TodoTasks = todoTasks,
            InProgressTasks = inProgressTasks,
            FixTasks = fixTasks,
            ReviewTasks = reviewTasks,
            DoneTasks = doneTasks,
            BlockedTasks = blockedTasks,
            CompletionPercentage = completionPercentage,
            TotalEstimatedHours = totalEstimatedHours,
            TotalActualHours = totalActualHours,
            OverdueTasks = overdueTasks,
            StartDate = project.StartDate,
            DueDate = project.DueDate,
            StatusBreakdown = statusBreakdown,
            RecentTasks = recentTasks
        };
    }
    public async Task<ProjectSummaryDto> GetProjectSummaryAsync(long projectId, CancellationToken ct = default)
    {
        var project = await _ctx.Projects
            .Include(p => p.Tasks)
                .ThenInclude(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
            .Include(p => p.Epics)
                .ThenInclude(e => e.Tasks)
            .Include(p => p.Team)
                .ThenInclude(t => t.Department)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy dự án");
        var tasks = project.Tasks.ToList();
        var now = DateTime.UtcNow;
        var doneTasks = tasks.Count(t => t.Status == "done");
        var totalTasks = tasks.Count;
        var completionPercentage = totalTasks > 0 
            ? Math.Round((decimal)doneTasks / totalTasks * 100, 2) 
            : 0;
        var totalEstimatedHours = tasks.Where(t => t.EstimatedHours.HasValue).Sum(t => t.EstimatedHours!.Value);
        var totalActualHours = tasks.Where(t => t.ActualHours.HasValue).Sum(t => t.ActualHours!.Value);
        var overdueTasks = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != "done");
        var statusBreakdown = tasks
            .GroupBy(t => t.Status ?? "todo")
            .Select(g => new StatusCountDto
            {
                Status = g.Key,
                StatusName = GetStatusName(g.Key),
                Count = g.Count(),
                Color = GetStatusColor(g.Key)
            })
            .ToList();
        var epics = project.Epics.Select(e => 
        {
            var epicTasks = e.Tasks.ToList();
            var epicDone = epicTasks.Count(t => t.Status == "done");
            var epicTotal = epicTasks.Count;
            return new EpicSummaryDto
            {
                EpicId = e.Id,
                EpicName = e.Name,
                TotalTasks = epicTotal,
                CompletedTasks = epicDone,
                CompletionPercentage = epicTotal > 0 ? Math.Round((decimal)epicDone / epicTotal * 100, 2) : 0
            };
        }).ToList();
        var memberIds = tasks
            .SelectMany(t => t.TaskAssignments)
            .Select(ta => ta.UserId)
            .Distinct()
            .ToList();
        var members = await _ctx.Users
            .Where(u => memberIds.Contains(u.Id))
            .Select(u => new MemberSummaryDto
            {
                UserId = u.Id,
                Username = u.Username,
                FullName = $"{u.FirstName} {u.LastName}".Trim(),
                AssignedTasks = tasks.Count(t => t.TaskAssignments.Any(ta => ta.UserId == u.Id)),
                CompletedTasks = tasks.Count(t => t.Status == "done" && t.TaskAssignments.Any(ta => ta.UserId == u.Id))
            })
            .ToListAsync(ct);
        return new ProjectSummaryDto
        {
            ProjectId = project.Id,
            ProjectName = project.Name,
            ProjectCode = project.Code,
            Description = project.Description,
            Status = project.Status,
            StartDate = project.StartDate,
            DueDate = project.DueDate,
            TeamName = project.Team.Name,
            DepartmentName = project.Team.Department?.Name,
            TotalTasks = totalTasks,
            CompletedTasks = doneTasks,
            CompletionPercentage = completionPercentage,
            TotalMembers = members.Count,
            TotalEpics = epics.Count,
            TotalEstimatedHours = totalEstimatedHours,
            TotalActualHours = totalActualHours,
            OverdueTasks = overdueTasks,
            StatusBreakdown = statusBreakdown,
            Epics = epics,
            Members = members
        };
    }
    public async Task<AllProjectsDashboardDto> GetAllProjectsDashboardAsync(CancellationToken ct = default)
    {
        var projects = await _ctx.Projects
            .Include(p => p.Tasks)
            .ToListAsync(ct);
        var allTasks = projects.SelectMany(p => p.Tasks).ToList();
        var totalTasks = allTasks.Count;
        var completedTasks = allTasks.Count(t => t.Status == "done");
        var overallCompletionPercentage = totalTasks > 0 
            ? Math.Round((decimal)completedTasks / totalTasks * 100, 2) 
            : 0;
        var projectProgresses = new List<ProjectProgressDto>();
        foreach (var project in projects)
        {
            var progress = await GetProjectProgressAsync(project.Id, ct);
            projectProgresses.Add(progress);
        }
        return new AllProjectsDashboardDto
        {
            TotalProjects = projects.Count,
            ActiveProjects = projects.Count(p => p.Status != "completed" && p.Status != "closed"),
            CompletedProjects = projects.Count(p => p.Status == "completed" || p.Status == "closed"),
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            OverallCompletionPercentage = overallCompletionPercentage,
            Projects = projectProgresses
        };
    }
    public async Task<List<UserTaskDashboardDto>> GetUserTaskDashboardAsync(UserTaskDashboardFilterDto filter, CancellationToken ct = default)
    {
        var currentUser = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _ctx, ct)
            ?? throw new UnauthorizedAccessException("Người dùng chưa đăng nhập.");
        var roles = currentUser.RoleName ?? new List<string>();
        var isAdmin = roles.Contains("system_admin");
        IQueryable<User> usersQuery = _ctx.Users
            .AsNoTracking()
            .Include(u => u.Department)
            .Include(u => u.Roles)
            .Where(u => u.IsActive ?? true);
        if (!isAdmin)
        {
            if (!currentUser.DepartmentId.HasValue)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xem dữ liệu nhân viên ngoài phòng ban.");
            }
            var departmentId = currentUser.DepartmentId.Value;
            if (filter.DepartmentId.HasValue)
            {
                usersQuery = usersQuery.Where(u => u.DepartmentId == filter.DepartmentId.Value);
            }
            else
            {
                usersQuery = usersQuery.Where(u => u.DepartmentId == departmentId);
            }
        }
        else if (filter.DepartmentId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.DepartmentId == filter.DepartmentId.Value);
        }
        if (filter.UserId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.Id == filter.UserId.Value);
        }
        var userIdsQuery = usersQuery.Select(u => u.Id);
        var users = await usersQuery
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync(ct);
        if (users.Count == 0)
        {
            return new List<UserTaskDashboardDto>();
        }
        var assignments = await _ctx.TaskAssignments
            .AsNoTracking()
            .Where(ta => userIdsQuery.Contains(ta.UserId))
            .Include(ta => ta.Task)
                .ThenInclude(t => t.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.UserTeamAssignments)
            .Include(ta => ta.Task)
                .ThenInclude(t => t.Project)
                    .ThenInclude(p => p.UserProjectAssignments)
            .Include(ta => ta.Task)
                .ThenInclude(t => t.ParentTask)
            .Include(ta => ta.User)
            .ToListAsync(ct);
        
        // Filter assignments to only include tasks from projects where the user is a team member
        assignments = assignments.Where(ta =>
        {
            if (ta.Task?.Project == null) return false;
            var project = ta.Task.Project;
            var userId = ta.UserId;
            
            // Check if user is in the project's team
            // User is in team if:
            // 1. User is team lead
            // 2. User is in UserTeamAssignments for the project's team
            // 3. User is directly assigned to the project via UserProjectAssignments
            var isTeamLead = project.Team?.LeadId == userId;
            var isTeamMember = project.Team?.UserTeamAssignments?.Any(uta => uta.UserId == userId) ?? false;
            var isProjectMember = project.UserProjectAssignments?.Any(upa => upa.UserId == userId) ?? false;
            
            return isTeamLead || isTeamMember || isProjectMember;
        }).ToList();
        
        if (filter.ProjectId.HasValue)
        {
            assignments = assignments.Where(ta => ta.Task != null && ta.Task.ProjectId == filter.ProjectId.Value).ToList();
        }
        var unassignedTasks = new List<DataAccess.Models.Task>();
        if (filter.ProjectId.HasValue)
        {
            // Get the project and check if any of the filtered users are team members
            var project = await _ctx.Projects
                .AsNoTracking()
                .Include(p => p.Team)
                    .ThenInclude(t => t.UserTeamAssignments)
                .Include(p => p.UserProjectAssignments)
                .FirstOrDefaultAsync(p => p.Id == filter.ProjectId.Value, ct);
            
            if (project != null)
            {
                // Check if any user in the filtered list is a team member
                var userIds = users.Select(u => u.Id).ToList();
                var hasTeamMember = userIds.Any(userId =>
                {
                    var isTeamLead = project.Team?.LeadId == userId;
                    var isTeamMember = project.Team?.UserTeamAssignments?.Any(uta => uta.UserId == userId) ?? false;
                    var isProjectMember = project.UserProjectAssignments?.Any(upa => upa.UserId == userId) ?? false;
                    return isTeamLead || isTeamMember || isProjectMember;
                });
                
                if (hasTeamMember)
                {
                    var allProjectTasks = await _ctx.Tasks
                        .AsNoTracking()
                        .Where(t => t.ProjectId == filter.ProjectId.Value)
                        .Include(t => t.Project)
                        .Include(t => t.ParentTask)
                        .ToListAsync(ct);
                    var assignedTaskIds = assignments
                        .Where(a => a.TaskId != null)
                        .Select(a => a.TaskId)
                        .Distinct()
                        .ToList();
                    unassignedTasks = allProjectTasks
                        .Where(t => !assignedTaskIds.Contains(t.Id))
                        .ToList();
                }
            }
        }
        var assignmentTaskIdsQuery = _ctx.TaskAssignments
            .AsNoTracking()
            .Where(ta => userIdsQuery.Contains(ta.UserId))
            .Select(ta => ta.TaskId)
            .Distinct();
        var assigneesByTask = await _ctx.TaskAssignments
            .AsNoTracking()
            .Where(ta => assignmentTaskIdsQuery.Contains(ta.TaskId))
            .Include(ta => ta.User)
            .GroupBy(ta => ta.TaskId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.Select(x =>
                    x.User != null && (!string.IsNullOrWhiteSpace(x.User.FirstName) ||
                    !string.IsNullOrWhiteSpace(x.User.LastName))
                        ? $"{x.User.FirstName} {x.User.LastName}".Trim()
                        : x.User?.Username ?? ""
                ).Where(name => !string.IsNullOrEmpty(name)).Distinct().ToList(),
                ct
            );
        foreach (var task in unassignedTasks)
        {
            assigneesByTask.TryAdd(task.Id, new List<string>());
        }
        var now = DateTime.UtcNow;
        var today = DateTime.UtcNow.Date;
        var result = new List<UserTaskDashboardDto>();
        foreach (var user in users)
        {
            var userAssignments = assignments
                .Where(a => a.UserId == user.Id)
                .ToList();
            var taskDtos = userAssignments
                .Select(a =>
                {
                    var task = a.Task;
                    if (task == null)
                        return null;
                    var projectCode = task.Project?.Code ?? "";
                    var createdAt = task.CreatedAt ?? a.AssignedAt ?? task.UpdatedAt ?? now;
                    var dueDate = task.DueDate;
                    var status = task.Status ?? "todo";
                    var isOverdue = dueDate.HasValue && dueDate.Value.Date < today && status != "done";
                    var isDueSoon = dueDate.HasValue && !isOverdue && status != "done" &&
                                    (dueDate.Value.Date - today).TotalDays <= 3;
                    var assigneeNames = assigneesByTask.TryGetValue(task.Id, out var list)
                        ? list
                        : new List<string>();
                    return new UserTaskTimelineDto
                    {
                        TaskId = task.Id,
                        TaskKey = !string.IsNullOrEmpty(projectCode) ? $"{projectCode}-{task.Id}" : $"TASK-{task.Id}",
                        Title = task.Title,
                        Status = status,
                        StatusName = GetStatusName(status),
                        Priority = task.Priority ?? "medium",
                        DueDate = dueDate,
                        IsOverdue = isOverdue,
                        IsDueSoon = isDueSoon,
                        CreatedAt = createdAt,
                        UpdatedAt = task.UpdatedAt,
                        AssignedAt = a.AssignedAt,
                        ParentTaskId = task.ParentTaskId,
                        ParentTaskTitle = task.ParentTask?.Title,
                        ProjectId = task.ProjectId,
                        ProjectName = task.Project?.Name ?? "",
                        ProjectCode = projectCode,
                        AssigneeNames = assigneeNames,
                        EstimatedHours = task.EstimatedHours,
                        ActualHours = task.ActualHours
                    };
                })
                .Where(t => t != null)
                .Cast<UserTaskTimelineDto>()
                .GroupBy(t => t.TaskId)
                .Select(g => g.First())
                .OrderBy(t => t.CreatedAt)
                .ToList();
            result.Add(new UserTaskDashboardDto
            {
                UserId = user.Id,
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                Email = user.Email,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name,
                Roles = user.Roles.Select(r => r.Name).ToList(),
                Tasks = taskDtos
            });
        }
        if (unassignedTasks.Any())
        {
            var unassignedTaskDtos = unassignedTasks
                .Select(task =>
                {
                    var projectCode = task.Project?.Code ?? "";
                    var createdAt = task.CreatedAt ?? task.UpdatedAt ?? now;
                    var dueDate = task.DueDate;
                    var status = task.Status ?? "todo";
                    var isOverdue = dueDate.HasValue && dueDate.Value.Date < today && status != "done";
                    var isDueSoon = dueDate.HasValue && !isOverdue && status != "done" &&
                                    (dueDate.Value.Date - today).TotalDays <= 3;
                    var assigneeNames = assigneesByTask.TryGetValue(task.Id, out var list)
                        ? list
                        : new List<string>();
                    return new UserTaskTimelineDto
                    {
                        TaskId = task.Id,
                        TaskKey = !string.IsNullOrEmpty(projectCode) ? $"{projectCode}-{task.Id}" : $"TASK-{task.Id}",
                        Title = task.Title,
                        Status = status,
                        StatusName = GetStatusName(status),
                        Priority = task.Priority ?? "medium",
                        DueDate = dueDate,
                        IsOverdue = isOverdue,
                        IsDueSoon = isDueSoon,
                        CreatedAt = createdAt,
                        UpdatedAt = task.UpdatedAt,
                        AssignedAt = null,
                        ParentTaskId = task.ParentTaskId,
                        ParentTaskTitle = task.ParentTask?.Title,
                        ProjectId = task.ProjectId,
                        ProjectName = task.Project?.Name ?? "",
                        ProjectCode = projectCode,
                        AssigneeNames = assigneeNames,
                        EstimatedHours = task.EstimatedHours,
                        ActualHours = task.ActualHours
                    };
                })
                .OrderBy(t => t.CreatedAt)
                .ToList();
            result.Add(new UserTaskDashboardDto
            {
                UserId = -1,
                FullName = "Chưa gán",
                Email = "",
                DepartmentId = null,
                DepartmentName = null,
                Roles = new List<string>(),
                Tasks = unassignedTaskDtos
            });
        }
        return result;
    }
    public async Task<List<UserDto>> GetAllUsersAsync(CancellationToken ct = default)
    {
        var users = await _ctx.Users
            .AsNoTracking()
            .Include(u => u.Department)
            .Include(u => u.Roles)
            .Include(u => u.UserTeamAssignments)
                .ThenInclude(uta => uta.Team)
            .Where(u => u.IsActive ?? true)
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Select(u => new UserDto
            {
                Id = u.Id,
                EmployeeCode = u.EmployeeCode,
                Username = u.Username,
                Email = u.Email,
                FullName = $"{u.FirstName} {u.LastName}".Trim(),
                DepartmentId = u.DepartmentId,
                DepartmentName = u.Department != null ? u.Department.Name : "",
                AvatarUrl = u.AvatarUrl,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                RoleId = u.Roles.Select(e => (long)e.Id).ToList(),
                RoleName = u.Roles.Select(r => r.Name).ToList(),
                TeamIds = u.UserTeamAssignments.Select(uta => (long)uta.TeamId).ToList()
            })
            .ToListAsync(ct);
        return users;
    }
    public async Task<MyDayStatisticsDto> GetMyDayStatisticsAsync(long userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var tomorrow = today.AddDays(1);
        var tasks = await _ctx.Tasks
            .AsNoTracking()
            .Include(t => t.TaskAssignments)
            .Where(t => t.TaskAssignments.Any(ta => ta.UserId == userId) && t.Status != "done")
            .ToListAsync(ct);
        var overdue = tasks.Count(t => 
            t.DueDate.HasValue && t.DueDate.Value.Date < today
        );
        var dueToday = tasks.Count(t =>
            t.DueDate.HasValue && t.DueDate.Value.Date == today
        );
        var dueTomorrow = tasks.Count(t =>
            t.DueDate.HasValue && t.DueDate.Value.Date == tomorrow
        );
        var total = tasks.Count;
        var completedTasks = await _ctx.Tasks
            .AsNoTracking()
            .Include(t => t.TaskAssignments)
            .Where(t => t.TaskAssignments.Any(ta => ta.UserId == userId) && t.Status == "done")
            .CountAsync(ct);
        return new MyDayStatisticsDto
        {
            Total = total,
            Overdue = overdue,
            DueToday = dueToday,
            DueTomorrow = dueTomorrow,
            Completed = completedTasks
        };
    }
    private string GetStatusName(string status) => status switch
    {
        "todo" => "Cần làm",
        "in_progress" => "Đang thực hiện",
        "fix" => "Cần sửa",
        "review" => "Đang xem xét",
        "done" => "Đã hoàn thành",
        _ => status
    };
    private string GetStatusColor(string status) => status switch
    {
        "todo" => "#DFE1E6",
        "in_progress" => "#3B82F6",
        "fix" => "#F97316",
        "review" => "#F59E0B",
        "done" => "#10B981",
        _ => "#9CA3AF"
    };
}