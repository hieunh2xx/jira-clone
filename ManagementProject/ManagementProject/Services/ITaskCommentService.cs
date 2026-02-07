using ManagementProject.DTO;
namespace ManagementProject.Services;
public interface ITaskCommentService
{
    Task<CommentDto> CreateCommentAsync(long taskId, CreateCommentRequest dto, IFormFile[]? files, CancellationToken ct = default);
    Task<List<CommentDto>> GetCommentsByTaskIdAsync(long taskId, CancellationToken ct = default);
    Task<CommentDto> UpdateCommentAsync(long commentId, UpdateCommentRequest dto, CancellationToken ct = default);
    Task DeleteCommentAsync(long commentId, CancellationToken ct = default);
}