using ManagementProject.DTO;
using System.Security.Claims;
namespace ManagementProject.Services;
public interface IJwtService
{
    string GenerateToken(UserDto user);
    ClaimsPrincipal? ValidateToken(string token);
    string? GetUserIdFromToken(string token);
    List<string>? GetRolesFromToken(string token);
}