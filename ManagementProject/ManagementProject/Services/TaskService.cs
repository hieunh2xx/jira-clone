using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Repositories;
using ManagementProject.Cache;
using ManagementProject.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
namespace ManagementProject.Services;
public class TaskService : ITaskService
{
    private readonly ITaskRepository _repo;
    private readonly ProjectManagementDbContext _ctx;
    private readonly TaskCacheService _cache;
    private readonly CloudinaryService _cloudinaryService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IEmailService _emailService;
    public TaskService(
        ITaskRepository repo, 
        ProjectManagementDbContext ctx, 
        TaskCacheService cache, 
        CloudinaryService cloudinaryService, 
        IHttpContextAccessor httpContextAccessor,
        IEmailService emailService)
    {
        _repo = repo;
        _ctx = ctx;
        _cache = cache;
        _cloudinaryService = cloudinaryService;
        _httpContextAccessor = httpContextAccessor;
        _emailService = emailService;
    }
    private bool IsProjectLeader(UserDto user, DataAccess.Models.Task task)
    {
        var project = _ctx.Projects
            .Include(p => p.Team)
            .FirstOrDefault(p => p.Id == task.ProjectId);
        if (project?.Team == null) return false;
        return project.Team.LeadId == user.Id;
    }
    private bool IsSystemAdmin(UserDto user)
    {
        return user.RoleName.Any(r =>
            string.Equals(r?.Trim().ToLowerInvariant(), "system_admin", StringComparison.OrdinalIgnoreCase));
    }
    public async Task<TaskDetailDto> CreateTaskAsync(CreateTaskDto dto, CancellationToken ct = default)
    {
        var project = await _ctx.Projects.FirstOrDefaultAsync(p => p.Id == dto.ProjectId, ct)
                      ?? throw new KeyNotFoundException("Project not found");
        long issueTypeId = dto.IssueTypeId;
        if (issueTypeId <= 0)
        {
            var defaultIssueType = await _ctx.IssueTypes.FirstOrDefaultAsync(ct);
            if (defaultIssueType == null)
                throw new InvalidOperationException("No issue types found in the system. Please create an issue type first.");
            issueTypeId = defaultIssueType.Id;
        }
        else
        {
            var issueTypeExists = await _ctx.IssueTypes.AnyAsync(it => it.Id == issueTypeId, ct);
            if (!issueTypeExists)
            {
                var defaultIssueType = await _ctx.IssueTypes.FirstOrDefaultAsync(ct);
                if (defaultIssueType == null)
                    throw new InvalidOperationException("No issue types found in the system. Please create an issue type first.");
                issueTypeId = defaultIssueType.Id;
            }
        }
        if (dto.EpicId.HasValue && dto.EpicId.Value > 0)
        {
            var epicExists = await _ctx.Epics.AnyAsync(e => e.Id == dto.EpicId.Value && e.ProjectId == dto.ProjectId, ct);
            if (!epicExists)
                throw new ArgumentException($"Epic with Id {dto.EpicId.Value} not found in project {dto.ProjectId}");
        }
        if (dto.ParentTaskId.HasValue && dto.ParentTaskId.Value > 0)
        {
            var parentTaskExists = await _ctx.Tasks.AnyAsync(t => t.Id == dto.ParentTaskId.Value && t.ProjectId == dto.ProjectId, ct);
            if (!parentTaskExists)
                throw new ArgumentException($"Parent task with Id {dto.ParentTaskId.Value} not found in project {dto.ProjectId}");
        }
        var task = new DataAccess.Models.Task
        {
            Title = dto.Title,
            Description = dto.Description,
            ProjectId = dto.ProjectId,
            EpicId = dto.EpicId,
            IssueTypeId = issueTypeId,
            Priority = dto.Priority,
            Status = dto.Status,
            DueDate = dto.DueDate.HasValue
                ? (dto.DueDate.Value.Kind == DateTimeKind.Local
                    ? dto.DueDate.Value.ToUniversalTime()
                    : (dto.DueDate.Value.Kind == DateTimeKind.Unspecified
                        ? DateTime.SpecifyKind(dto.DueDate.Value, DateTimeKind.Utc)
                        : dto.DueDate.Value))
                : null,
            EstimatedHours = dto.EstimatedHours,
            ActualHours = 0,
            ParentTaskId = dto.ParentTaskId,
            CreatedBy = dto.CreatedBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        if (dto.AssigneeIds != null && dto.AssigneeIds.Any())
        {
            foreach (var uid in dto.AssigneeIds)
                task.TaskAssignments.Add(new() { UserId = uid, AssignedBy = dto.CreatedBy, AssignedAt = DateTime.UtcNow });
        }
        if (dto.CategoryIds != null && dto.CategoryIds.Any())
        {
            var cats = await _ctx.Categories.Where(c => dto.CategoryIds.Contains(c.Id)).ToListAsync(ct);
            foreach (var c in cats) task.Categories.Add(c);
        }
        if (dto.Images != null && dto.Images.Any())
        {
            foreach (var img in dto.Images)
            {
                try
                {
                    if (img == null || img.Length == 0)
                        continue;
                    using var stream = img.OpenReadStream();
                    var uploadResult = _cloudinaryService.UploadImage(stream, img.FileName);
                    if (uploadResult == null || uploadResult.SecureUrl == null)
                    {
                        throw new InvalidOperationException($"Cloudinary upload failed for image {img.FileName}");
                    }
                    task.TaskImages.Add(new TaskImage
                    {
                        FileName = img.FileName,
                        FileSizeKb = (int)(img.Length / 1024),
                        ImageUrl = uploadResult.SecureUrl.AbsoluteUri,
                        UploadedAt = DateTime.UtcNow
                    });
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Failed to upload image {img?.FileName ?? "unknown"}: {ex.Message}", ex);
                }
            }
        }
        if (dto.Files != null && dto.Files.Any())
        {
            foreach (var f in dto.Files)
            {
                try
                {
                    if (f == null || f.Length == 0)
                        continue;
                    using var stream = f.OpenReadStream();
                    var uploadResult = _cloudinaryService.UploadFile(stream, f.FileName);
                    if (uploadResult == null || uploadResult.SecureUrl == null)
                    {
                        throw new InvalidOperationException($"Cloudinary upload failed for file {f.FileName}");
                    }
                    task.TaskFiles.Add(new TaskFile
                    {
                        FileName = f.FileName,
                        FileSizeKb = (int)(f.Length / 1024),
                        FileUrl = uploadResult.SecureUrl.AbsoluteUri,
                        UploadedAt = DateTime.UtcNow
                    });
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Failed to upload file {f?.FileName ?? "unknown"}: {ex.Message}", ex);
                }
            }
        }
        var created = await _repo.CreateAsync(task, ct);
        _cache.InvalidateAllTasks(dto.ProjectId);
        _cache.InvalidateAllTasks(dto.ProjectId, dto.EpicId);
        var reloadedTask = await _repo.GetDetailByIdAsync(created.Id, ct) 
            ?? throw new KeyNotFoundException("Task không tồn tại sau khi tạo");
        var detailDto = await MapDetail(reloadedTask, project.Code, ct);
        _cache.SetTask(MapSummary(reloadedTask, project.Code));
        
        // Send email to assignees when task is created with assignees
        if (dto.AssigneeIds != null && dto.AssigneeIds.Any())
        {
            await _emailService.SendTaskAssignedEmailAsync(created.Id, dto.AssigneeIds, dto.CreatedBy);
        }
        
        return detailDto;
    }
    public async Task<TaskDetailDto> GetTaskDetailAsync(long taskId, CancellationToken ct = default)
    {
        var cached = _cache.GetTask(taskId);
        if (cached != null)
        {
            var task = await _repo.GetDetailByIdAsync(taskId, ct);
            if (task != null)
            {
                var project = await _ctx.Projects.FirstOrDefaultAsync(p => p.Id == task.ProjectId, ct);
                return await MapDetail(task, project!.Code, ct);
            }
        }
        var dbTask = await _repo.GetDetailByIdAsync(taskId, ct) ?? throw new KeyNotFoundException();
        var projectDetail = await _ctx.Projects.FirstOrDefaultAsync(p => p.Id == dbTask.ProjectId, ct);
        var detail = await MapDetail(dbTask, projectDetail!.Code, ct);
        _cache.SetTask(MapSummary(dbTask, projectDetail.Code));
        return detail;
    }
    public async Task<List<TaskDto>> getTaskbyProject(long projectId, CancellationToken ct = default)
    {
        var cached = _cache.GetAllTasks(projectId);
        if (cached != null && cached.Any())
        {
            return cached;
        }
        var tasks = await _repo.GetByProjectAsync(projectId, ct);
        if (tasks == null || !tasks.Any())
        {
            return new List<TaskDto>();
        }
        var project = await _ctx.Projects
                                .FirstOrDefaultAsync(p => p.Id == projectId, ct)
                                ?? throw new KeyNotFoundException("Project not found");
        var taskDtos = tasks.Select(t => MapSummary(t, project.Code)).ToList();
        _cache.SetAllTasks(projectId, taskDtos);
        return taskDtos;
    }
    public async Task<KanbanBoardDto> GetKanbanBoardAsync(long projectId, CancellationToken ct = default)
    {
        var cached = _cache.GetAllTasks(projectId);
        if (cached != null)
        {
            return BuildKanbanFromCache(cached);
        }
        var tasks = await _repo.GetByProjectAsync(projectId, ct);
        var project = await _ctx.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct)
                      ?? throw new KeyNotFoundException();
        var dtos = tasks.Select(t => MapSummary(t, project.Code)).ToList();
        _cache.SetAllTasks(projectId, dtos);
        return BuildKanbanFromCache(dtos);
    }
    public async Task<TaskDetailDto> UpdateTaskAsync(long taskId, UpdateTaskDto dto, CancellationToken ct = default)
    {
        var task = await _repo.GetByIdAsync(taskId, ct) ?? throw new KeyNotFoundException();
        var currentUser = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _ctx, ct)
                          ?? throw new UnauthorizedAccessException("Người dùng chưa đăng nhập.");
        if (IsSystemAdmin(currentUser))
            throw new UnauthorizedAccessException("System admin không được phép chỉnh sửa task.");
        // Allow anyone to edit task and assign tasks to anyone - removed restriction
        // Anyone can assign tasks to anyone in the project
        if (dto.Title != null) task.Title = dto.Title;
        if (dto.Description != null) task.Description = dto.Description;
        if (dto.Status != null) task.Status = dto.Status;
        if (dto.Priority != null) task.Priority = dto.Priority;
        if (dto.DueDate != null)
        {
            var dueDate = dto.DueDate.Value;
            if (dueDate.Kind == DateTimeKind.Local)
            {
                task.DueDate = dueDate.ToUniversalTime();
            }
            else if (dueDate.Kind == DateTimeKind.Unspecified)
            {
                task.DueDate = DateTime.SpecifyKind(dueDate, DateTimeKind.Utc);
            }
            else
            {
                task.DueDate = dueDate;
            }
        }
        if (dto.EstimatedHours != null) task.EstimatedHours = dto.EstimatedHours;
        if (dto.ActualHours != null) task.ActualHours = dto.ActualHours;
        if (dto.EpicId != null) task.EpicId = dto.EpicId;
        if (dto.IssueTypeId != null) task.IssueTypeId = dto.IssueTypeId.Value;
        if (dto.ParentTaskId != null) task.ParentTaskId = dto.ParentTaskId;
        List<long>? newAssigneesToNotify = null;
        if (dto.AssigneeIds != null)
        {
            var existingAssignees = task.TaskAssignments.Select(a => a.UserId).ToList();
            var newAssignees = dto.AssigneeIds.Distinct().ToList();
            var toRemove = task.TaskAssignments.Where(a => !newAssignees.Contains(a.UserId)).ToList();
            foreach (var r in toRemove)
                task.TaskAssignments.Remove(r);
            var toAdd = newAssignees.Where(uid => !existingAssignees.Contains(uid)).ToList();
            foreach (var uid in toAdd)
            {
                task.TaskAssignments.Add(new TaskAssignment
                {
                    UserId = uid,
                    AssignedBy = currentUser.Id,
                    AssignedAt = DateTime.UtcNow
                });
            }
            newAssigneesToNotify = toAdd;
        }
        if (dto.CategoryIds != null)
        {
            var existingCats = task.Categories.Select(c => c.Id).ToList();
            var newCats = dto.CategoryIds.Distinct().ToList();
            var toRemoveCats = task.Categories.Where(c => !newCats.Contains(c.Id)).ToList();
            foreach (var c in toRemoveCats)
                task.Categories.Remove(c);
            var catsToAdd = await _ctx.Categories.Where(c => newCats.Contains(c.Id) && !existingCats.Contains(c.Id)).ToListAsync(ct);
            foreach (var c in catsToAdd)
                task.Categories.Add(c);
        }
        if (dto.Images != null)
        {
            foreach (var img in dto.Images)
            {
                using var stream = img.OpenReadStream();
                var uploadResult = _cloudinaryService.UploadImage(stream, img.FileName);
                task.TaskImages.Add(new TaskImage
                {
                    FileName = img.FileName,
                    FileSizeKb = (int)(img.Length / 1024),
                    ImageUrl = uploadResult.SecureUrl.AbsoluteUri,
                    UploadedAt = DateTime.UtcNow
                });
            }
        }
        if (dto.Files != null)
        {
            foreach (var f in dto.Files)
            {
                using var stream = f.OpenReadStream();
                var uploadResult = _cloudinaryService.UploadImage(stream, f.FileName);
                task.TaskFiles.Add(new TaskFile
                {
                    FileName = f.FileName,
                    FileSizeKb = (int)(f.Length / 1024),
                    FileUrl = uploadResult.SecureUrl.AbsoluteUri,
                    UploadedAt = DateTime.UtcNow
                });
            }
        }
        task.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(task, ct);
        if (newAssigneesToNotify != null && newAssigneesToNotify.Any())
        {
            await _emailService.SendTaskAssignedEmailAsync(taskId, newAssigneesToNotify, currentUser.Id);
        }
        // Send email to project leader when member updates task
        var projectForEmail = await _ctx.Projects
            .Include(p => p.CreatedByNavigation)
            .FirstOrDefaultAsync(p => p.Id == task.ProjectId, ct);
        if (projectForEmail != null && projectForEmail.CreatedBy != null && projectForEmail.CreatedBy != currentUser.Id)
        {
            await _emailService.SendTaskUpdatedEmailAsync(taskId, currentUser.Id);
        }
        _cache.RemoveTask(taskId);
        _cache.InvalidateAllTasks(task.ProjectId);
        if (task.EpicId.HasValue) _cache.InvalidateAllTasks(task.ProjectId, task.EpicId);
        var updatedTask = await _repo.GetDetailByIdAsync(taskId, ct) ?? throw new KeyNotFoundException();
        var project = await _ctx.Projects.FirstOrDefaultAsync(p => p.Id == updatedTask.ProjectId, ct);
        var updatedDto = await MapDetail(updatedTask, project!.Code, ct);
        _cache.SetTask(MapSummary(updatedTask, project.Code));
        return updatedDto;
    }
    public async Task<bool> UpdateTaskStatusOnlyAsync(long taskId, string status, long userId, CancellationToken ct = default)
    {
        var task = await _ctx.Tasks
            .Include(t => t.Project).ThenInclude(p => p.WorkflowSchemes).ThenInclude(ws => ws.WorkflowStatuses)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct) ?? throw new KeyNotFoundException();
        var oldStatus = task.Status;
        if (task.Status == status) return true;
        var scheme = task.Project.WorkflowSchemes.FirstOrDefault();
        if (scheme != null && scheme.WorkflowStatuses.Any())
        {
            var from = scheme.WorkflowStatuses.FirstOrDefault(s => s.Name == task.Status);
            var to = scheme.WorkflowStatuses.FirstOrDefault(s => s.Name == status);
            if (from != null && to != null)
            {
                var valid = await _ctx.WorkflowTransitions.AnyAsync(t => t.FromStatusId == from.Id && t.ToStatusId == to.Id, ct);
                if (!valid) throw new InvalidOperationException($"Cannot move from {task.Status} to {status}");
            }
        }
        var success = await _repo.UpdateStatusOnlyAsync(taskId, status, ct);
        if (success)
        {
            _cache.RemoveTask(taskId);
            _cache.InvalidateAllTasks(task.ProjectId);
            if (task.EpicId.HasValue) _cache.InvalidateAllTasks(task.ProjectId, task.EpicId);
            await _emailService.SendTaskStatusChangedEmailAsync(taskId, oldStatus ?? "todo", status, userId);
        }
        return success;
    }
    public async System.Threading.Tasks.Task DeleteTaskAsync(long taskId, CancellationToken ct = default)
    {
        var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _ctx, ct)
                          ?? throw new UnauthorizedAccessException("Người dùng chưa đăng nhập.");
        if (IsSystemAdmin(userSession))
        {
            throw new UnauthorizedAccessException("System admin không được phép xóa task.");
        }
        var task = await _repo.GetByIdAsync(taskId, ct) ?? throw new KeyNotFoundException("Task không tồn tại.");
        bool canDelete = false;
        // Check if user is the creator
        if (task.CreatedBy == userSession.Id)
        {
            canDelete = true;
        }
        // Check if user is project leader
        else if (IsProjectLeader(userSession, task))
        {
            canDelete = true;
        }
        if (!canDelete)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa task này. Chỉ người tạo task hoặc leader của dự án mới được xóa.");
        }
        await _repo.DeleteAsync(taskId, ct);
        _cache.RemoveTask(taskId);
        _cache.InvalidateAllTasks(task.ProjectId);
        if (task.EpicId.HasValue) _cache.InvalidateAllTasks(task.ProjectId, task.EpicId);
    }
    private KanbanBoardDto BuildKanbanFromCache(List<TaskDto> dtos)
    {
        var allStatuses = new[] { "todo", "in_progress", "fix", "review", "done" };
        var columns = allStatuses
            .Select(status => new KanbanColumnDto
            {
                Status = status,
                Color = GetColor(status),
                Tasks = dtos
                    .Where(t => t.Status == status)
                    .OrderBy(t => GetPriorityOrder(t.Priority))
                    .ThenBy(t => t.CreatedAt)
                    .ToList()
            })
            .OrderBy(c => GetStatusOrder(c.Status))
            .ToList();
        return new KanbanBoardDto { Columns = columns };
    }
    private TaskDto MapSummary(DataAccess.Models.Task t, string code) => new()
    {
        Id = t.Id,
        Key = $"{code}-{t.Id}",
        Title = t.Title,
        Description = t.Description,
        Status = t.Status ?? "todo",
        StatusName = GetStatusName(t.Status ?? "todo"),
        Priority = t.Priority ?? "medium",
        DueDate = t.DueDate.HasValue ? (DateTime?)DateTime.SpecifyKind(t.DueDate.Value, DateTimeKind.Utc) : null,
        IsOverdue = t.DueDate != null && t.DueDate.Value.Date <= DateTime.UtcNow.Date && t.Status != "done",
        EstimatedHours = t.EstimatedHours ?? 0,
        ActualHours = t.ActualHours ?? 0,
        ProjectId = t.ProjectId,
        ProjectName = t.Project?.Name ?? "",
        EpicId = t.EpicId,
        EpicName = t.Epic?.Name,
        IssueTypeId = t.IssueTypeId,
        IssueTypeName = t.IssueType?.Name ?? "Task",
        ParentTaskId = t.ParentTaskId,
        ParentTaskTitle = t.ParentTask?.Title,
        AssigneeIds = t.TaskAssignments.Select(a => a.UserId).ToList(),
        AssigneeNames = t.TaskAssignments.Where(a => a.User != null).Select(a => a.User!.Username).ToList(),
        CategoryIds = t.Categories.Select(c => c.Id).ToList(),
        CategoryNames = t.Categories.Select(c => c.Name).ToList(),
        CreatedAt = DateTime.SpecifyKind((DateTime)t.CreatedAt, DateTimeKind.Utc),
        UpdatedAt = DateTime.SpecifyKind((DateTime)t.UpdatedAt, DateTimeKind.Utc),
        CreatedBy = t.CreatedBy ?? 0,
        CreatedByName = t.CreatedByNavigation != null
            ? (!string.IsNullOrWhiteSpace(t.CreatedByNavigation.FirstName) || !string.IsNullOrWhiteSpace(t.CreatedByNavigation.LastName)
                ? $"{t.CreatedByNavigation.FirstName} {t.CreatedByNavigation.LastName}".Trim()
                : (!string.IsNullOrWhiteSpace(t.CreatedByNavigation.Username)
                    ? t.CreatedByNavigation.Username
                    : "Unknown"))
            : "Unknown",
        Images = t.TaskImages?.Select(img => new TaskImageDto
        {
            Id = img.Id,
            FileName = img.FileName,
            ImageUrl = img.ImageUrl,
            FileSizeKb = img.FileSizeKb,
            UploadedAt = DateTime.SpecifyKind(img.UploadedAt, DateTimeKind.Utc)
        }).ToList() ?? new List<TaskImageDto>(),
        Files = t.TaskFiles?.Select(f => new TaskFileDto
        {
            Id = f.Id,
            FileName = f.FileName,
            FileUrl = f.FileUrl,
            FileSizeKb = f.FileSizeKb,
            UploadedAt = DateTime.SpecifyKind(f.UploadedAt, DateTimeKind.Utc)
        }).ToList() ?? new List<TaskFileDto>()
    };
    private async Task<TaskDetailDto> MapDetail(DataAccess.Models.Task t, string code, CancellationToken ct)
    {
        var baseDto = MapSummary(t, code);
        return new TaskDetailDto
        {
            Id = baseDto.Id,
            Key = baseDto.Key,
            Title = baseDto.Title,
            Description = baseDto.Description,
            Status = baseDto.Status,
            StatusName = baseDto.StatusName,
            Priority = baseDto.Priority,
            DueDate = baseDto.DueDate,
            IsOverdue = baseDto.IsOverdue,
            EstimatedHours = baseDto.EstimatedHours,
            ActualHours = baseDto.ActualHours,
            ProjectId = baseDto.ProjectId,
            ProjectName = baseDto.ProjectName,
            EpicId = baseDto.EpicId,
            EpicName = baseDto.EpicName,
            IssueTypeId = baseDto.IssueTypeId,
            IssueTypeName = baseDto.IssueTypeName,
            ParentTaskId = baseDto.ParentTaskId,
            ParentTaskTitle = baseDto.ParentTaskTitle,
            AssigneeIds = baseDto.AssigneeIds,
            AssigneeNames = baseDto.AssigneeNames,
            CategoryIds = baseDto.CategoryIds,
            CategoryNames = baseDto.CategoryNames,
            CreatedAt = baseDto.CreatedAt,
            UpdatedAt = baseDto.UpdatedAt,
            CreatedBy = baseDto.CreatedBy,
            CreatedByName = baseDto.CreatedByName,
            Images = baseDto.Images,
            Files = baseDto.Files,
            CustomFields = t.TaskCustomValues
                .Where(x => x.CustomField != null && !string.IsNullOrEmpty(x.CustomField.Name))
                .GroupBy(x => x.CustomField!.Name)
                .ToDictionary(g => g.Key, g => g.First().Value ?? ""),
            Comments = await MapCommentsTree(t.TaskComments.ToList(), ct)
        };
    }
    private async Task<List<TaskCommentDto>> MapCommentsTree(List<DataAccess.Models.TaskComment> comments, CancellationToken ct)
    {
        var roots = comments.Where(c => c.ParentCommentId == null);
        var result = new List<TaskCommentDto>();
        foreach (var c in roots)
            result.Add(await MapCommentWithReplies(c, comments, ct));
        return result.OrderBy(c => c.CreatedAt).ToList();
    }
    private async Task<TaskCommentDto> MapCommentWithReplies(DataAccess.Models.TaskComment c, List<DataAccess.Models.TaskComment> all, CancellationToken ct)
    {
        var replies = all.Where(x => x.ParentCommentId == c.Id).ToList();
        return new TaskCommentDto
        {
            Id = c.Id,
            Content = c.Content ?? "",
            PrimaryImageUrl = c.ImageUrl,
            AdditionalImages = c.TaskCommentImages.Select(i => new TaskCommentImageDto
            {
                Id = i.Id,
                ImageUrl = i.ImageUrl,
                FileName = i.FileName,
                FileSizeKb = i.FileSizeKb,
                UploadedAt = DateTime.SpecifyKind(i.UploadedAt ?? DateTime.UtcNow, DateTimeKind.Utc)
            }).ToList(),
            UserId = c.UserId,
            Username = c.User.Username,
            FullName = $"{c.User.FirstName} {c.User.LastName}".Trim(),
            IsReview = c.IsReview ?? false,
            Rating = c.Rating,
            ParentCommentId = c.ParentCommentId,
            CreatedAt = DateTime.SpecifyKind(c.CreatedAt ?? DateTime.UtcNow, DateTimeKind.Utc),
            Replies = replies.Count > 0 ? (await System.Threading.Tasks.Task.WhenAll(replies.Select(r => MapCommentWithReplies(r, all, ct)))).ToList() : new()
        };
    }
    private string GetColor(string s) => s switch
    {
        "todo" => "#DFE1E6",
        "in_progress" => "#3B82F6",
        "fix" => "#F97316",
        "review" => "#F59E0B",
        "done" => "#10B981",
        _ => "#9CA3AF"
    };
    private int GetStatusOrder(string s) => s switch { "todo" => 1, "in_progress" => 2, "fix" => 3, "review" => 4, "done" => 5, _ => 99 };
    private int GetPriorityOrder(string p) => p switch { "highest" => 1, "high" => 2, "medium" => 3, "low" => 4, "lowest" => 5, _ => 3 };
    private string GetStatusName(string status) => status switch
    {
        "todo" => "Cần làm",
        "in_progress" => "Đang thực hiện",
        "fix" => "Cần sửa",
        "review" => "Đang xem xét",
        "done" => "Đã hoàn thành",
        _ => status
    };
}