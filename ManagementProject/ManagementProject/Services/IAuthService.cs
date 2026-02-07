using ManagementProject.DTO;
using DataAccess.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace ManagementProject.Services
{
    public interface IAuthService
    {
        Task<ResponeSuccess<List<UserDto>>> GetAllUsersAsync();
        Task<ResponeSuccess<List<UserDto>>> SearchUsersByEmailAsync(string emailKeyword);
        Task<ResponeSuccess<UserDto>> GetUserByIdAsync(long id);
        Task<ResponeSuccess<UserDto>> LoginAsync(string? username, string? email, string password);
        Task<LoginResponseDto> LoginWithJwtAsync(string? username, string? email, string password);
        Task<ResponeSuccess<UserDto>> RegisterAsync(RegisterUserDto dto);
        Task<ResponeSuccess<UserDto>> UpdateUserAsync(long id, UserUpdate updatedUser);
        Task<ResponeSuccess<UserDto>> UpdateUserRolesAsync(long id, List<short> roleIds);
        Task<ResponeSuccess<string>> DeleteUserAsync(long id);
    }
}