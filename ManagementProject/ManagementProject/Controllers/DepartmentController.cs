using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Mvc;
namespace ManagementProject.Controllers;
[ApiController]
[Route("api/departments")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class DepartmentController : ControllerBase
{
    private readonly IDepartmentService _departmentService;
    public DepartmentController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }
    [HttpGet]
    public async Task<ActionResult> GetAll(CancellationToken ct = default)
    {
        try
        {
            var departments = await _departmentService.GetAllDepartmentsAsync(ct);
            return Ok(new { code = 200, message = "Thành công", data = departments });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
    [HttpGet("{id:long}")]
    public async Task<ActionResult> GetById(long id, CancellationToken ct = default)
    {
        try
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id, ct);
            if (department == null)
                return NotFound(new { code = 404, message = "Không tìm thấy bộ phận", data = (object?)null });
            return Ok(new { code = 200, message = "Thành công", data = department });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
    [HttpPost]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> Create([FromBody] CreateDepartmentRequest dto, CancellationToken ct = default)
    {
        try
        {
            var department = await _departmentService.CreateDepartmentAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id = department.Id }, new { code = 200, message = "Thành công", data = department });
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
    [HttpPut("{id:long}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> Update(long id, [FromBody] UpdateDepartmentRequest dto, CancellationToken ct = default)
    {
        try
        {
            var department = await _departmentService.UpdateDepartmentAsync(id, dto, ct);
            return Ok(new { code = 200, message = "Thành công", data = department });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
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
    [HttpDelete("{id:long}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> Delete(long id, CancellationToken ct = default)
    {
        try
        {
            await _departmentService.DeleteDepartmentAsync(id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { code = 403, message = ex.Message, data = (object?)null });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
        }
    }
    [HttpGet("{id:long}/roles")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> GetRoles(long id, CancellationToken ct = default)
    {
        try
        {
            var roles = await _departmentService.GetRolesForDepartmentAsync(id, ct);
            return Ok(new { code = 200, message = "Thành công", data = roles });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
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
    [HttpPost("{id:long}/roles")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> AssignRoles(long id, [FromBody] AssignRoleToDepartmentRequest dto, CancellationToken ct = default)
    {
        try
        {
            dto.DepartmentId = id;
            await _departmentService.AssignRolesToDepartmentAsync(dto, ct);
            return Ok(new { code = 200, message = "Phân quyền thành công", data = (object?)null });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message, data = (object?)null });
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
}