using ManagementProject.DTO;
using ManagementProject.Services;
using ManagementProject.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
namespace ManagementProject.Controllers;
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public NotificationController(INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
    {
        _notificationService = notificationService;
        _httpContextAccessor = httpContextAccessor;
    }
    [HttpGet]
    public async Task<ActionResult> GetNotifications(
        [FromQuery] bool? isRead = null,
        [FromQuery] int? limit = null,
        CancellationToken ct = default)
    {
        var userId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
        if (userId == null)
        {
            return Unauthorized(new { code = 401, message = "Không xác thực", data = (object?)null });
        }
        var notifications = await _notificationService.GetNotificationsByUserIdAsync(userId.Value, isRead, limit, ct);
        // Trả về data rỗng nếu không có notification, không cần thông báo lỗi
        return Ok(new { code = 200, message = "Thành công", data = notifications ?? new List<NotificationDto>() });
    }
    [HttpGet("unread-count")]
    public async Task<ActionResult> GetUnreadCount(CancellationToken ct = default)
    {
        var userId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
        if (userId == null)
        {
            return Unauthorized(new { code = 401, message = "Không xác thực", data = (object?)null });
        }
        var count = await _notificationService.GetUnreadCountAsync(userId.Value, ct);
        return Ok(new { code = 200, message = "Thành công", data = new { count } });
    }
    [HttpGet("{id:long}")]
    public async Task<ActionResult> GetNotification(long id, CancellationToken ct = default)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id, ct);
        if (notification == null)
        {
            return NotFound(new { code = 404, message = "Không tìm thấy thông báo", data = (object?)null });
        }
        var userId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
        if (userId == null || notification.ProjectId == null)
        {
            return Unauthorized(new { code = 401, message = "Không xác thực", data = (object?)null });
        }
        return Ok(new { code = 200, message = "Thành công", data = notification });
    }
    [HttpPatch("{id:long}/read")]
    public async Task<ActionResult> MarkAsRead(long id, CancellationToken ct = default)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id, ct);
        if (notification == null)
        {
            return NotFound(new { code = 404, message = "Không tìm thấy thông báo", data = (object?)null });
        }
        await _notificationService.MarkAsReadAsync(id, ct);
        return Ok(new { code = 200, message = "Đánh dấu đã đọc thành công", data = (object?)null });
    }
    [HttpPatch("mark-all-read")]
    public async Task<ActionResult> MarkAllAsRead(CancellationToken ct = default)
    {
        var userId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
        if (userId == null)
        {
            return Unauthorized(new { code = 401, message = "Không xác thực", data = (object?)null });
        }
        await _notificationService.MarkAllAsReadAsync(userId.Value, ct);
        return Ok(new { code = 200, message = "Đánh dấu tất cả đã đọc thành công", data = (object?)null });
    }
    [HttpDelete("{id:long}")]
    public async Task<ActionResult> DeleteNotification(long id, CancellationToken ct = default)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id, ct);
        if (notification == null)
        {
            return NotFound(new { code = 404, message = "Không tìm thấy thông báo", data = (object?)null });
        }
        await _notificationService.DeleteNotificationAsync(id, ct);
        return Ok(new { code = 200, message = "Xóa thông báo thành công", data = (object?)null });
    }
}
