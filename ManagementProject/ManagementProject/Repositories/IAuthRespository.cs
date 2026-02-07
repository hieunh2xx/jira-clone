using DataAccess.Models;
using ManagementProject.DTO;
namespace ManagementProject.Repository
{
    public interface IAuthRepository
    {
        Task<ResponeSuccess<UserDto>> LoginAsync(string? username,string email, string password);
        Task<List<UserDto>> GetAllUsersAsync();  
        Task<List<UserDto>> SearchUsersByEmailAsync(string emailKeyword);
        Task<UserDto?> GetUserByIdAsync(long id);
        Task<ResponeSuccess<UserDto>> RegisterAsync(RegisterUserDto dto);
        Task<UserDto?> UpdateAsync(long id, UserUpdate updatedUser);
        Task<UserDto?> UpdateUserRolesAsync(long id, List<short> roleIds);
        System.Threading.Tasks.Task DeleteAsync(long id);
    }
}