using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
namespace ManagementProject.Controllers;
[ApiController]
[Route("api/projects/{projectId}/issues")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class TaskController : ControllerBase
{
    private readonly ITaskService _taskService;
    public TaskController(ITaskService taskService)
    {
        _taskService = taskService;
    }
    [HttpPost]
    [RequestSizeLimit(104857600)]
    public async Task<ActionResult<TaskDetailDto>> CreateIssue(
        long projectId,
        [FromForm] CreateTaskDto dto,
        [FromForm(Name = "images")] IFormFile[]? images,
        [FromForm(Name = "files")] IFormFile[]? files,
        CancellationToken ct = default)
    {
        try
        {
            dto.ProjectId = projectId;
            Console.WriteLine($"[TaskController] CreateIssue - Images from parameter: {images?.Length ?? 0}");
            Console.WriteLine($"[TaskController] CreateIssue - Files from parameter: {files?.Length ?? 0}");
            Console.WriteLine($"[TaskController] CreateIssue - Images from DTO: {dto.Images?.Count ?? 0}");
            Console.WriteLine($"[TaskController] CreateIssue - Files from DTO: {dto.Files?.Count ?? 0}");
            if (images != null && images.Length > 0)
            {
                dto.Images = images.ToList();
                Console.WriteLine($"[TaskController] CreateIssue - Using images from parameter: {dto.Images.Count}");
            }
            else if (dto.Images == null || dto.Images.Count == 0)
            {
                Console.WriteLine($"[TaskController] CreateIssue - No images provided");
            }
            if (files != null && files.Length > 0)
            {
                dto.Files = files.ToList();
                Console.WriteLine($"[TaskController] CreateIssue - Using files from parameter: {dto.Files.Count}");
            }
            else if (dto.Files == null || dto.Files.Count == 0)
            {
                Console.WriteLine($"[TaskController] CreateIssue - No files provided");
            }
            var result = await _taskService.CreateTaskAsync(
                dto,
                ct
            );
            Console.WriteLine($"[TaskController] CreateIssue - Task created with {result.Images?.Count ?? 0} images and {result.Files?.Count ?? 0} files");
            return CreatedAtAction(nameof(GetIssueDetail), new { projectId, issueId = result.Id }, result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TaskController] Error creating task: {ex.Message}");
            Console.WriteLine($"[TaskController] Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[TaskController] Inner exception: {ex.InnerException.Message}");
            }
            throw;
        }
    }
    [HttpGet("Get")]
    [HttpPatch("{issueId}")]
    [RequestSizeLimit(104857600)]
    public async Task<ActionResult<TaskDetailDto>> UpdateIssue(
        long projectId,
        long issueId,
        [FromForm] UpdateTaskDto dto,
        [FromForm(Name = "images")] IFormFile[]? images,
        [FromForm(Name = "files")] IFormFile[]? files,
        CancellationToken ct = default)
    {
        try
        {
            if (images != null && images.Length > 0)
            {
                dto.Images = images.ToList();
            }
            if (files != null && files.Length > 0)
            {
                dto.Files = files.ToList();
            }
            var result = await _taskService.UpdateTaskAsync(
                issueId,
                dto,
                ct
            );
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TaskController] Error updating task: {ex.Message}");
            Console.WriteLine($"[TaskController] Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[TaskController] Inner exception: {ex.InnerException.Message}");
            }
            throw;
        }
    }
    [HttpGet("{issueId}")]
    public async Task<ActionResult<TaskDetailDto>> GetIssueDetail(
        long projectId,
        long issueId,
        CancellationToken ct = default)
    {
        var result = await _taskService.GetTaskDetailAsync(issueId, ct);
        return Ok(result);
    }
    [HttpGet]
    public async Task<ActionResult<KanbanBoardDto>> GetKanbanBoard(
        long projectId,
        CancellationToken ct = default)
    {
        var result = await _taskService.GetKanbanBoardAsync(projectId, ct);
        return Ok(result);
    }
    [HttpPatch("{issueId}/status")]
    public async Task<IActionResult> UpdateIssueStatus(
        long projectId,
        long issueId,
        [FromBody] UpdateTaskStatusRequest request,
        [FromHeader(Name = "X-User-Id")] long userId = 1,
        CancellationToken ct = default)
    {
        var success = await _taskService.UpdateTaskStatusOnlyAsync(issueId, request.Status, userId, ct);
        return success ? NoContent() : BadRequest("Cannot update status");
    }
    [HttpDelete("{issueId}")]
    public async Task<IActionResult> DeleteIssue(
        long projectId,
        long issueId,
        CancellationToken ct = default)
    {
        await _taskService.DeleteTaskAsync(issueId, ct);
        return NoContent();
    }
}