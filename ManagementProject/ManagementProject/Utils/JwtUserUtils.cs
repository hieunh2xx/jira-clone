using System.Security.Claims;
using ManagementProject.DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using DataAccess.Models;
namespace ManagementProject.Utils;
public static class JwtUserUtils
{
    public static UserDto? GetUserFromClaims(IHttpContextAccessor httpContextAccessor)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.User?.Identity?.IsAuthenticated != true)
            return null;
        var claims = httpContext.User;
        var userIdClaim = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
            return null;
        var username = claims.FindFirst(ClaimTypes.Name)?.Value ?? "";
        var email = claims.FindFirst(ClaimTypes.Email)?.Value ?? "";
        var fullName = claims.FindFirst("FullName")?.Value ?? "";
        var employeeCode = claims.FindFirst("EmployeeCode")?.Value ?? "";
        var departmentIdStr = claims.FindFirst("DepartmentId")?.Value;
        long? departmentId = null;
        if (!string.IsNullOrEmpty(departmentIdStr) && long.TryParse(departmentIdStr, out var deptId))
        {
            departmentId = deptId;
        }
        var roles = claims.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        return new UserDto
        {
            Id = userId,
            Username = username,
            Email = email,
            FullName = fullName,
            EmployeeCode = employeeCode,
            DepartmentId = departmentId,
            RoleName = roles,
            RoleId = new List<long>()
        };
    }
    public static async Task<UserDto?> GetUserFromClaimsWithDbAsync(
        IHttpContextAccessor httpContextAccessor,
        ProjectManagementDbContext context,
        CancellationToken ct = default)
    {
        var user = GetUserFromClaims(httpContextAccessor);
        if (user == null)
            return null;
        var dbUser = await context.Users
            .AsNoTracking()
            .Include(u => u.Roles)
            .Include(u => u.Department)
            .Include(u => u.Teams)
            .FirstOrDefaultAsync(u => u.Id == user.Id, ct);
        if (dbUser != null)
        {
            user.DepartmentName = dbUser.Department?.Name ?? "";
            user.AvatarUrl = dbUser.AvatarUrl;
            user.IsActive = dbUser.IsActive ?? false;
            user.RoleId = dbUser.Roles.Select(r => (long)r.Id).ToList();
            user.TeamIds = dbUser.Teams.Select(t => t.Id).ToList();
            user.CreatedAt = dbUser.CreatedAt;
            user.UpdatedAt = dbUser.UpdatedAt;
        }
        return user;
    }
    public static long? GetUserIdFromClaims(IHttpContextAccessor httpContextAccessor)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.User?.Identity?.IsAuthenticated != true)
            return null;
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}