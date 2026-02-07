using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TaskModel = DataAccess.Models.Task;
namespace ManagementProject.Repositories;
public class NotificationRepository : INotificationRepository
{
    private readonly ProjectManagementDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public NotificationRepository(ProjectManagementDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }
    public async Task<NotificationDto> CreateNotificationAsync(NotificationCreateDto dto, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = dto.UserId,
            Type = dto.Type,
            Title = dto.Title,
            Message = dto.Message,
            ProjectId = dto.ProjectId,
            TaskId = dto.TaskId,
            CommentId = dto.CommentId,
            EvaluationId = dto.EvaluationId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);
        return await GetNotificationByIdAsync(notification.Id, ct) ?? new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            ProjectId = notification.ProjectId,
            TaskId = notification.TaskId,
            CommentId = notification.CommentId,
            EvaluationId = notification.EvaluationId,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        };
    }
    public async Task<List<NotificationDto>> GetNotificationsByUserIdAsync(long userId, bool? isRead = null, int? limit = null, CancellationToken ct = default)
    {
        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .Include(n => n.Project)
            .Include(n => n.Task)
            .OrderByDescending(n => n.CreatedAt)
            .AsQueryable();
        if (isRead.HasValue)
        {
            query = query.Where(n => n.IsRead == isRead.Value);
        }
        if (limit.HasValue)
        {
            query = query.Take(limit.Value);
        }
        var notifications = await query.ToListAsync(ct);
        return notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type,
            Title = n.Title,
            Message = n.Message,
            ProjectId = n.ProjectId,
            ProjectName = n.Project?.Name,
            TaskId = n.TaskId,
            TaskTitle = n.Task?.Title,
            CommentId = n.CommentId,
            EvaluationId = n.EvaluationId,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            ReadAt = n.ReadAt
        }).ToList();
    }
    public async Task<int> GetUnreadCountAsync(long userId, CancellationToken ct = default)
    {
        return await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);
    }
    public async Task<NotificationDto?> GetNotificationByIdAsync(long id, CancellationToken ct = default)
    {
        var notification = await _context.Notifications
            .AsNoTracking()
            .Include(n => n.Project)
            .Include(n => n.Task)
            .FirstOrDefaultAsync(n => n.Id == id, ct);
        if (notification == null)
            return null;
        return new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            ProjectId = notification.ProjectId,
            ProjectName = notification.Project?.Name,
            TaskId = notification.TaskId,
            TaskTitle = notification.Task?.Title,
            CommentId = notification.CommentId,
            EvaluationId = notification.EvaluationId,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ReadAt = notification.ReadAt
        };
    }
    public async System.Threading.Tasks.Task MarkAsReadAsync(long id, CancellationToken ct = default)
    {
        var notification = await _context.Notifications.FindAsync(new object[] { id }, ct);
        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }
    }
    public async System.Threading.Tasks.Task MarkAllAsReadAsync(long userId, CancellationToken ct = default)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = now;
        }
        await _context.SaveChangesAsync(ct);
    }
    public async System.Threading.Tasks.Task DeleteNotificationAsync(long id, CancellationToken ct = default)
    {
        var notification = await _context.Notifications.FindAsync(new object[] { id }, ct);
        if (notification != null)
        {
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync(ct);
        }
    }
}
