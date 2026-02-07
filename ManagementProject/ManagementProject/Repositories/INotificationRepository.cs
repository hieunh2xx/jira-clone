using ManagementProject.DTO;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
namespace ManagementProject.Repositories;
public interface INotificationRepository
{
    Task<NotificationDto> CreateNotificationAsync(NotificationCreateDto dto, CancellationToken ct = default);
    Task<List<NotificationDto>> GetNotificationsByUserIdAsync(long userId, bool? isRead = null, int? limit = null, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(long userId, CancellationToken ct = default);
    Task<NotificationDto?> GetNotificationByIdAsync(long id, CancellationToken ct = default);
    System.Threading.Tasks.Task MarkAsReadAsync(long id, CancellationToken ct = default);
    System.Threading.Tasks.Task MarkAllAsReadAsync(long userId, CancellationToken ct = default);
    System.Threading.Tasks.Task DeleteNotificationAsync(long id, CancellationToken ct = default);
}
