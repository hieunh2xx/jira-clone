using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Mvc;
namespace ManagementProject.Controllers;
[ApiController]
[Route("api/dashboard")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }
    [HttpGet("projects/{projectId}/progress")]
    public async Task<ActionResult> GetProjectProgress(
        long projectId,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _dashboardService.GetProjectProgressAsync(projectId, ct);
            return Ok(new { code = 200, message = "Thành công", data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
    [HttpGet("projects/{projectId}/summary")]
    public async Task<ActionResult> GetProjectSummary(
        long projectId,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _dashboardService.GetProjectSummaryAsync(projectId, ct);
            return Ok(new { code = 200, message = "Thành công", data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
    [HttpGet("projects/all")]
    public async Task<ActionResult> GetAllProjectsDashboard(CancellationToken ct = default)
    {
        try
        {
            var result = await _dashboardService.GetAllProjectsDashboardAsync(ct);
            return Ok(new { code = 200, message = "Thành công", data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
    [HttpGet("users")]
    public async Task<ActionResult> GetUserTaskDashboard(
        [FromQuery] long? departmentId,
        [FromQuery] long? userId,
        [FromQuery] long? projectId,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _dashboardService.GetUserTaskDashboardAsync(
                new UserTaskDashboardFilterDto
                {
                    DepartmentId = departmentId,
                    UserId = userId,
                    ProjectId = projectId
                },
                ct);
            return Ok(new { code = 200, message = "Thành công", data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { code = 403, message = ex.Message, data = (object?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
    [HttpGet("all-users")]
    public async Task<ActionResult> GetAllUsers(CancellationToken ct = default)
    {
        try
        {
            var result = await _dashboardService.GetAllUsersAsync(ct);
            return Ok(new { code = 200, message = "Thành công", data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
    [HttpGet("my-day/statistics/{userId}")]
    public async Task<ActionResult> GetMyDayStatistics(
        long userId,
        CancellationToken ct = default)
    {
        try
        {
            var currentUserIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            if (currentUserIdClaim == null || !long.TryParse(currentUserIdClaim.Value, out var currentUserId))
            {
                return Unauthorized(new { code = 401, message = "Không xác thực", data = (object?)null });
            }
            if (userId != currentUserId)
            {
                var isAdmin = User.IsInRole("system_admin") || User.IsInRole("admin");
                if (!isAdmin)
                {
                    return Forbid();
                }
            }
            var result = await _dashboardService.GetMyDayStatisticsAsync(userId, ct);
            return Ok(new { code = 200, message = "Thành công", data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
}