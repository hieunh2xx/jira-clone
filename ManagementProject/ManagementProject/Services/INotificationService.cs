using ManagementProject.DTO;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
namespace ManagementProject.Services;
public interface INotificationService
{
    Task<NotificationDto> CreateNotificationAsync(NotificationCreateDto dto, CancellationToken ct = default);
    Task<List<NotificationDto>> GetNotificationsByUserIdAsync(long userId, bool? isRead = null, int? limit = null, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(long userId, CancellationToken ct = default);
    Task<NotificationDto?> GetNotificationByIdAsync(long id, CancellationToken ct = default);
    System.Threading.Tasks.Task MarkAsReadAsync(long id, CancellationToken ct = default);
    System.Threading.Tasks.Task MarkAllAsReadAsync(long userId, CancellationToken ct = default);
    System.Threading.Tasks.Task DeleteNotificationAsync(long id, CancellationToken ct = default);
    System.Threading.Tasks.Task NotifyProjectChangeAsync(long projectId, string changeType, string title, string message, long? excludeUserId = null, CancellationToken ct = default);
    System.Threading.Tasks.Task NotifyTaskCommentAsync(long taskId, long commentId, long commentUserId, string commentContent, CancellationToken ct = default);
    System.Threading.Tasks.Task NotifyProjectEvaluationAsync(long projectId, long evaluationId, long evaluationUserId, CancellationToken ct = default);
}
