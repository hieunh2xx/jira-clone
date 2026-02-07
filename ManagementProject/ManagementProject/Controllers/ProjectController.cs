using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
namespace ManagementProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;
        public ProjectController(IProjectService projectService)
        {
            _projectService = projectService;
        }
        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] string? keyword, [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct)
        {
            if (page.HasValue && pageSize.HasValue)
            {
                var result = await _projectService.GetAllProjectPaged(keyword, page.Value, pageSize.Value, ct);
                return Ok(new { code = 200, message = "Thành công", data = result });
            }
            else
            {
                var projects = await _projectService.GetAllProject(keyword, ct);
                return Ok(new { code = 200, message = "Thành công", data = projects });
            }
        }
        [HttpGet("{id:long}")]
        public async Task<ActionResult> GetById(long id, CancellationToken ct)
        {
            var project = await _projectService.GetProjectDetail(id, ct);
            if (project == null)
                return NotFound(new { code = 404, message = "Không tìm thấy project", data = (object?)null });
            return Ok(new { code = 200, message = "Thành công", data = project });
        }
        [HttpGet("my-projects")]
        public async Task<ActionResult> GetByUser(CancellationToken ct)
        {
            var projects = await _projectService.GetProjectByUser(ct);
            return Ok(new { code = 200, message = "Thành công", data = projects });
        }
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] ProjectCreateDTO dto, CancellationToken ct)
        {
            await _projectService.AddProject(dto, ct);
            return StatusCode(StatusCodes.Status201Created, new { code = 201, message = "Tạo project thành công", data = (object?)null });
        }
        [HttpPut("{id:int}")]
        public async Task<ActionResult> Update(int id, [FromBody] ProjectUpdateDTO dto, CancellationToken ct)
        {
            await _projectService.UpdateProject(id, dto, ct);
            return Ok(new { code = 200, message = "Cập nhật project thành công", data = (object?)null });
        }
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> Delete(int id, CancellationToken ct)
        {
            try
            {
                await _projectService.DeleteProject(id, ct);
                return Ok(new { code = 200, message = "Xóa project thành công", data = (object?)null });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { code = 401, message = ex.Message, data = (object?)null });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { code = 500, message = $"Lỗi khi xóa project: {innerMessage}", data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi xóa project: {ex.Message}", data = (object?)null });
            }
        }
        [HttpPost("{id:long}/complete")]
        public async Task<ActionResult> Complete(long id, CancellationToken ct)
        {
            await _projectService.CompleteProject(id, ct);
            return Ok(new { code = 200, message = "Đánh dấu hoàn thành dự án thành công. Tất cả thành viên cần đánh giá trước khi xem thông tin dự án.", data = (object?)null });
        }
        [HttpPost("{id:long}/reopen")]
        public async Task<ActionResult> Reopen(long id, CancellationToken ct)
        {
            await _projectService.ReopenProject(id, ct);
            return Ok(new { code = 200, message = "Mở lại dự án thành công. Dự án có thể tiếp tục được chỉnh sửa.", data = (object?)null });
        }
        [HttpGet("{id:long}/members")]
        public async Task<ActionResult> GetMembers(long id, CancellationToken ct)
        {
            var members = await _projectService.GetProjectMembers(id, ct);
            return Ok(new { code = 200, message = "Thành công", data = members });
        }
        [HttpPost("{id:long}/members")]
        public async Task<ActionResult> AddMember(long id, [FromBody] AddProjectMemberDTO dto, CancellationToken ct)
        {
            try
            {
                await _projectService.AddProjectMember(id, dto.UserId, ct);
                return Ok(new { code = 200, message = "Thêm member vào project thành công", data = (object?)null });
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
        [HttpDelete("{id:long}/members/{userId:long}")]
        public async Task<ActionResult> RemoveMember(long id, long userId, CancellationToken ct)
        {
            try
            {
                await _projectService.RemoveProjectMember(id, userId, ct);
                return Ok(new { code = 200, message = "Xóa member khỏi project thành công", data = (object?)null });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { code = 401, message = ex.Message, data = (object?)null });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi xóa member: {ex.Message}", data = (object?)null });
            }
        }
        [HttpPost("{id:long}/members/{userId:long}/grant-keymain")]
        public async Task<ActionResult> GrantKeyMain(long id, long userId, CancellationToken ct)
        {
            try
            {
                await _projectService.GrantKeyMainPermission(id, userId, ct);
                return Ok(new { code = 200, message = "Cấp quyền keymain thành công", data = (object?)null });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { code = 401, message = ex.Message, data = (object?)null });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi cấp quyền keymain: {ex.Message}", data = (object?)null });
            }
        }
        [HttpDelete("{id:long}/members/{userId:long}/revoke-keymain")]
        public async Task<ActionResult> RevokeKeyMain(long id, long userId, CancellationToken ct)
        {
            try
            {
                await _projectService.RevokeKeyMainPermission(id, userId, ct);
                return Ok(new { code = 200, message = "Thu hồi quyền keymain thành công", data = (object?)null });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { code = 401, message = ex.Message, data = (object?)null });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi thu hồi quyền keymain: {ex.Message}", data = (object?)null });
            }
        }
    }
}