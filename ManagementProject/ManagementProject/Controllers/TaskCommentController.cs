using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Mvc;
namespace ManagementProject.Controllers;
[ApiController]
[Route("api/projects/{projectId}/issues/{issueId}/comments")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class TaskCommentController : ControllerBase
{
    private readonly ITaskCommentService _service;
    public TaskCommentController(ITaskCommentService service) => _service = service;
    [HttpPost]
    public async Task<ActionResult<CommentDto>> Create(
        long projectId, long issueId,
        [FromForm] CreateCommentRequest dto,
        IFormFile[]? files,
        CancellationToken ct = default)
    {
        var result = await _service.CreateCommentAsync(issueId, dto, files, ct);
        return CreatedAtAction(nameof(Get), new { projectId, issueId, commentId = result.Id }, result);
    }
    [HttpGet]
    public async Task<ActionResult<List<CommentDto>>> GetAll(
        long projectId, long issueId,
        CancellationToken ct = default)
        => Ok(await _service.GetCommentsByTaskIdAsync(issueId, ct));
    [HttpGet("{commentId}")]
    public async Task<ActionResult<CommentDto>> Get(
        long projectId, long issueId, long commentId,
        CancellationToken ct = default)
    {
        var comments = await _service.GetCommentsByTaskIdAsync(issueId, ct);
        var comment = FindComment(comments, commentId);
        return comment != null ? Ok(comment) : NotFound();
    }
    [HttpPatch("{commentId}")]
    public async Task<ActionResult<CommentDto>> Update(
        long projectId, long issueId, long commentId,
        [FromBody] UpdateCommentRequest dto,
        CancellationToken ct = default)
        => Ok(await _service.UpdateCommentAsync(commentId, dto, ct));
    [HttpDelete("{commentId}")]
    public async Task<IActionResult> Delete(
        long projectId, long issueId, long commentId,
        CancellationToken ct = default)
    {
        await _service.DeleteCommentAsync(commentId, ct);
        return NoContent();
    }
    private CommentDto? FindComment(List<CommentDto> comments, long id)
        => comments.FirstOrDefault(c => c.Id == id) ??
           comments.SelectMany(c => c.Replies).FirstOrDefault(c => c.Id == id);
}