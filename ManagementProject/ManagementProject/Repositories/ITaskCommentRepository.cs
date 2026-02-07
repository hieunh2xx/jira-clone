using DataAccess.Models;
namespace ManagementProject.Repositories
{
    public interface ITaskCommentRepository
    {
        Task<TaskComment> CreateAsync(TaskComment comment, List<TaskCommentImage> images, List<TaskCommentFile> files, CancellationToken ct = default);
        Task<TaskComment?> GetByIdAsync(long commentId, CancellationToken ct = default);
        Task<List<TaskComment>> GetByTaskIdAsync(long taskId, CancellationToken ct = default);
        System.Threading.Tasks.Task UpdateAsync(TaskComment comment, List<TaskCommentImage> newImages, List<TaskCommentFile> newFiles, CancellationToken ct = default);
        System.Threading.Tasks.Task DeleteAsync(long commentId, CancellationToken ct = default);
    }
}