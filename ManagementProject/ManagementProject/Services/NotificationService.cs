using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Repositories;
using ManagementProject.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TaskModel = DataAccess.Models.Task;
namespace ManagementProject.Services;
public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly ProjectManagementDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public NotificationService(
        INotificationRepository repository,
        ProjectManagementDbContext context,
        IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }
    public Task<NotificationDto> CreateNotificationAsync(NotificationCreateDto dto, CancellationToken ct = default)
    {
        return _repository.CreateNotificationAsync(dto, ct);
    }
    public Task<List<NotificationDto>> GetNotificationsByUserIdAsync(long userId, bool? isRead = null, int? limit = null, CancellationToken ct = default)
    {
        return _repository.GetNotificationsByUserIdAsync(userId, isRead, limit, ct);
    }
    public Task<int> GetUnreadCountAsync(long userId, CancellationToken ct = default)
    {
        return _repository.GetUnreadCountAsync(userId, ct);
    }
    public Task<NotificationDto?> GetNotificationByIdAsync(long id, CancellationToken ct = default)
    {
        return _repository.GetNotificationByIdAsync(id, ct);
    }
    public System.Threading.Tasks.Task MarkAsReadAsync(long id, CancellationToken ct = default)
    {
        return _repository.MarkAsReadAsync(id, ct);
    }
    public System.Threading.Tasks.Task MarkAllAsReadAsync(long userId, CancellationToken ct = default)
    {
        return _repository.MarkAllAsReadAsync(userId, ct);
    }
    public System.Threading.Tasks.Task DeleteNotificationAsync(long id, CancellationToken ct = default)
    {
        return _repository.DeleteNotificationAsync(id, ct);
    }
    public async System.Threading.Tasks.Task NotifyProjectChangeAsync(long projectId, string changeType, string title, string message, long? excludeUserId = null, CancellationToken ct = default)
    {
        var project = await _context.Projects
            .Include(p => p.UserProjectAssignments)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct);
        if (project == null)
            return;
        var userIds = project.UserProjectAssignments
            .Select(upa => upa.UserId)
            .Where(uid => excludeUserId == null || uid != excludeUserId)
            .ToList();
        if (project.CreatedBy.HasValue && (excludeUserId == null || project.CreatedBy.Value != excludeUserId))
        {
            if (!userIds.Contains(project.CreatedBy.Value))
            {
                userIds.Add(project.CreatedBy.Value);
            }
        }
        var tasks = userIds.Select(userId => CreateNotificationAsync(new NotificationCreateDto
        {
            UserId = userId,
            Type = "project_change",
            Title = title,
            Message = message,
            ProjectId = projectId
        }, ct));
        await System.Threading.Tasks.Task.WhenAll(tasks);
    }
    public async System.Threading.Tasks.Task NotifyTaskCommentAsync(long taskId, long commentId, long commentUserId, string commentContent, CancellationToken ct = default)
    {
        TaskModel? task = await _context.Tasks
            .Include(t => t.Project)
            .ThenInclude(p => p.UserProjectAssignments)
            .Include(t => t.TaskAssignments)
            .Include(t => t.TaskComments)
            .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);
        if (task == null)
            return;
        var userIds = new HashSet<long>();
        if (task.Project != null)
        {
            foreach (var assignment in task.Project.UserProjectAssignments)
            {
                if (assignment.UserId != commentUserId)
                {
                    userIds.Add(assignment.UserId);
                }
            }
        }
        foreach (var assignment in task.TaskAssignments)
        {
            if (assignment.UserId != commentUserId)
            {
                userIds.Add(assignment.UserId);
            }
        }
        foreach (var comment in task.TaskComments)
        {
            if (comment.UserId != commentUserId && comment.UserId != task.CreatedBy)
            {
                userIds.Add(comment.UserId);
            }
        }
        if (task.CreatedBy.HasValue && task.CreatedBy.Value != commentUserId)
        {
            userIds.Add(task.CreatedBy.Value);
        }
        var commentUser = await _context.Users.FindAsync(new object[] { commentUserId }, ct);
        var commentUserName = commentUser != null ? $"{commentUser.FirstName} {commentUser.LastName}" : "Người dùng";
        var message = $"{commentUserName} đã bình luận trên task \"{task.Title}\": {commentContent}";
        if (message.Length > 500)
        {
            message = message.Substring(0, 497) + "...";
        }
        var tasks = userIds.Select(userId => CreateNotificationAsync(new NotificationCreateDto
        {
            UserId = userId,
            Type = "task_comment",
            Title = $"Bình luận mới trên task: {task.Title}",
            Message = message,
            ProjectId = task.ProjectId,
            TaskId = taskId,
            CommentId = commentId
        }, ct));
        await System.Threading.Tasks.Task.WhenAll(tasks);
    }
    public async System.Threading.Tasks.Task NotifyProjectEvaluationAsync(long projectId, long evaluationId, long evaluationUserId, CancellationToken ct = default)
    {
        var project = await _context.Projects
            .Include(p => p.UserProjectAssignments)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct);
        if (project == null)
            return;
        var evaluation = await _context.ProjectEvaluations
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == evaluationId, ct);
        if (evaluation == null)
            return;
        var userIds = project.UserProjectAssignments
            .Select(upa => upa.UserId)
            .Where(uid => uid != evaluationUserId)
            .ToList();
        if (project.CreatedBy.HasValue && project.CreatedBy.Value != evaluationUserId)
        {
            if (!userIds.Contains(project.CreatedBy.Value))
            {
                userIds.Add(project.CreatedBy.Value);
            }
        }
        var evaluatorName = evaluation.User != null ? $"{evaluation.User.FirstName} {evaluation.User.LastName}" : "Người dùng";
        var message = $"{evaluatorName} đã đánh giá dự án \"{project.Name}\"";
        var tasks = userIds.Select(userId => CreateNotificationAsync(new NotificationCreateDto
        {
            UserId = userId,
            Type = "project_evaluation",
            Title = $"Đánh giá mới cho dự án: {project.Name}",
            Message = message,
            ProjectId = projectId,
            EvaluationId = evaluationId
        }, ct));
        await System.Threading.Tasks.Task.WhenAll(tasks);
    }
}
