using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
namespace ManagementProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;
        public AuthController(IAuthService authService)
        {
            _auth = authService;
        }
        [HttpPost("logout")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public IActionResult Logout()
        {
            return Ok(new { message = "Đã đăng xuất" });
        }
        [HttpGet("current-user")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var fullName = User.FindFirst("FullName")?.Value;
            var employeeCode = User.FindFirst("EmployeeCode")?.Value;
            var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
            if (userId == null)
                return Unauthorized("Token không hợp lệ");
            return Ok(new
            {
                Id = long.Parse(userId),
                Username = username,
                Email = email,
                FullName = fullName,
                EmployeeCode = employeeCode,
                RoleName = roles
            });
        }
        [HttpGet]
        public async Task<ActionResult<ResponeSuccess<List<UserDto>>>> GetAllUsers()
        {
            var result = await _auth.GetAllUsersAsync();
            return Ok(result);
        }
        [HttpGet("search")]
        public async Task<ActionResult<ResponeSuccess<List<UserDto>>>> SearchUsers([FromQuery] string keyword)
        {
            var result = await _auth.SearchUsersByEmailAsync(keyword ?? "");
            return Ok(result);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<ResponeSuccess<UserDto>>> GetUser(long id)
        {
            var result = await _auth.GetUserByIdAsync(id);
            if (result.Data == null)
                return NotFound(result);
            return Ok(result);
        }
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDTO loginDto)
        {
            var result = await _auth.LoginWithJwtAsync(loginDto.Username, loginDto.Email, loginDto.Password);
            if (result.Code != 200)
                return Unauthorized(result);
            return Ok(result);
        }
        [HttpPost]
        public async Task<ActionResult<ResponeSuccess<UserDto>>> Register([FromBody] RegisterUserDto user)
        {
            var result = await _auth.RegisterAsync(user);
            if (result.Code != 200)
                return Unauthorized(result);
            return Ok(result);
        }
        [HttpPut("{id}")]
        public async Task<ActionResult<ResponeSuccess<UserDto>>> Update([FromRoute] long id, [FromBody] UserUpdate user)
        {
            if (id <= 0) return BadRequest(new
            {
                code = 400,
                message = "Id không hợp lệ",
                data = (object?)null
            }); 
            var result = await _auth.UpdateUserAsync(id, user);
            if (result.Code != 200)
                return StatusCode(result.Code, result);
            return Ok(result);
        }
        [HttpPut("{id}/roles")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<ActionResult<ResponeSuccess<UserDto>>> UpdateUserRoles([FromRoute] long id, [FromBody] UpdateUserRoleRequest request)
        {
            if (id <= 0) return BadRequest(new
            {
                code = 400,
                message = "Id không hợp lệ",
                data = (object?)null
            });
            
            if (request == null || request.RoleIds == null)
            {
                return BadRequest(new
                {
                    code = 400,
                    message = "RoleIds không được để trống",
                    data = (object?)null
                });
            }
            
            try
            {
                var result = await _auth.UpdateUserRolesAsync(id, request.RoleIds);
                if (result.Code != 200)
                    return StatusCode(result.Code, result);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    code = 401,
                    message = ex.Message,
                    data = (object?)null
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    code = 404,
                    message = ex.Message,
                    data = (object?)null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    code = 500,
                    message = $"Lỗi khi cập nhật role: {ex.Message}",
                    data = (object?)null
                });
            }
        }
        [HttpDelete("{id}")]
        public async Task<ActionResult<ResponeSuccess<string>>> Delete([FromRoute] long id)
        {
            if(id <= 0) return BadRequest(new
            {
                code = 400,
                message = "Id không hợp lệ",
                data = (object?)null
            });
            var result = await _auth.DeleteUserAsync(id);
            if(result.Code != 200)
                return StatusCode(result.Code, result);
            return Ok(result);
        }
    }
}