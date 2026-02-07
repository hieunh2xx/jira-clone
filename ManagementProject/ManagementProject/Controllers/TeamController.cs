using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Mvc;
namespace ManagementProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _service;
        public TeamController(ITeamService service)
        {
            _service = service;
        }
        [HttpGet]
        public Task<List<TeamDTO>> GetAll([FromQuery] string? keyword)
        {
            return _service.GetAllTeams(keyword);
        }
        [HttpGet("{id}")]
        public Task<TeamDTO?> GetById(long id)
        {
            return _service.GetTeamDetail(id);
        }
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] TeamCreateDTO dto)
        {
            try
            {
                await _service.AddTeam(dto);
                return Ok(new { code = 200, message = "Tạo team thành công", data = (object?)null });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { code = 401, message = ex.Message, data = (object?)null });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi tạo team: {ex.Message}", data = (object?)null });
            }
        }
        [HttpPut("{id}")]
        public Task Update(long id, [FromBody] TeamUpdateDTO dto)
        {
            return _service.UpdateTeam(id, dto);
        }
        [HttpDelete("{id}")]
        public Task Delete(long id)
        {
            return _service.DeleteTeam(id);
        }
        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddMember(long id, [FromBody] AddTeamMemberDTO dto)
        {
            try
            {
                await _service.AddTeamMember(id, dto.UserId);
                return Ok(new { code = 200, message = "Thêm member thành công", data = (object?)null });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { code = 401, message = ex.Message, data = (object?)null });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi thêm member: {ex.Message}", data = (object?)null });
            }
        }
        [HttpDelete("{id}/members/{userId}")]
        public async Task<IActionResult> RemoveMember(long id, long userId)
        {
            try
            {
                await _service.RemoveTeamMember(id, userId);
                return Ok(new { code = 200, message = "Xóa member thành công", data = (object?)null });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { code = 401, message = ex.Message, data = (object?)null });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi xóa member: {ex.Message}", data = (object?)null });
            }
        }
    }
}