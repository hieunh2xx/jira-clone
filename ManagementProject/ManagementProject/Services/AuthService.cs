using ManagementProject.DTO;
using DataAccess.Models;
using ManagementProject.Repository;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
namespace ManagementProject.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly IJwtService _jwtService;
        public AuthService(IAuthRepository authRepository, IJwtService jwtService)
        {
            _authRepository = authRepository;
            _jwtService = jwtService;
        }
        public async Task<ResponeSuccess<List<UserDto>>> GetAllUsersAsync()
        {
            var users = await _authRepository.GetAllUsersAsync();
            if (users == null || !users.Any())
                return new ResponeSuccess<List<UserDto>>(404, "Không có user nào", null);
            return new ResponeSuccess<List<UserDto>>(200, "Lấy danh sách user thành công", users);
        }
        public async Task<ResponeSuccess<List<UserDto>>> SearchUsersByEmailAsync(string emailKeyword)
        {
            var users = await _authRepository.SearchUsersByEmailAsync(emailKeyword);
            return new ResponeSuccess<List<UserDto>>(200, "Tìm kiếm user thành công", users);
        }
        public async Task<ResponeSuccess<UserDto>> GetUserByIdAsync(long id)
        {
            var user = await _authRepository.GetUserByIdAsync(id);
            if (user == null)
                return new ResponeSuccess<UserDto>(404, $"Không tìm thấy user với Id {id}");
            return new ResponeSuccess<UserDto>(200, "Lấy thông tin user thành công", user);
        }
        public async Task<ResponeSuccess<UserDto>> LoginAsync(string? username, string? email, string password)
        {
            return await _authRepository.LoginAsync(username, email, password);
        }
        public async Task<ResponeSuccess<UserDto>> RegisterAsync(RegisterUserDto dto)
        {
            return await _authRepository.RegisterAsync(dto);
        }
        public async Task<ResponeSuccess<UserDto>> UpdateUserAsync(long id, UserUpdate updatedUser)
        {
            var userDto = await _authRepository.UpdateAsync(id, updatedUser);
            if (userDto == null)
                return new ResponeSuccess<UserDto>(404, $"Không tìm thấy user với Id {id}");
            return new ResponeSuccess<UserDto>(200, "Cập nhật user thành công", userDto);
        }
        public async Task<ResponeSuccess<UserDto>> UpdateUserRolesAsync(long id, List<short> roleIds)
        {
            var userDto = await _authRepository.UpdateUserRolesAsync(id, roleIds);
            if (userDto == null)
                return new ResponeSuccess<UserDto>(404, $"Không tìm thấy user với Id {id}");
            return new ResponeSuccess<UserDto>(200, "Cập nhật role cho user thành công", userDto);
        }
        public async Task<ResponeSuccess<string>> DeleteUserAsync(long id)
        {
            try
            {
                await _authRepository.DeleteAsync(id);
                return new ResponeSuccess<string>(200, "Xóa user thành công", null);
            }
            catch (KeyNotFoundException ex)
            {
                return new ResponeSuccess<string>(404, ex.Message, null);
            }
        }
        public async Task<LoginResponseDto> LoginWithJwtAsync(string? username, string? email, string password)
        {
            var result = await _authRepository.LoginAsync(username, email, password);
            if (result.Code != 200 || result.Data == null)
            {
                return new LoginResponseDto
                {
                    Code = result.Code,
                    Message = result.Message,
                    Token = null,
                    User = null
                };
            }
            var token = _jwtService.GenerateToken(result.Data);
            return new LoginResponseDto
            {
                Code = 200,
                Message = "Login thành công",
                Token = token,
                User = result.Data
            };
        }
    }
}