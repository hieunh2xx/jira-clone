using DataAccess.Models;
using Microsoft.EntityFrameworkCore;
namespace ManagementProject.Repositories;
public class TaskCommentRepository : ITaskCommentRepository
{
    private readonly ProjectManagementDbContext _context;
    public TaskCommentRepository(ProjectManagementDbContext context) => _context = context;
    public async Task<TaskComment> CreateAsync(TaskComment comment, List<TaskCommentImage> images, List<TaskCommentFile> files, CancellationToken ct = default)
    {
        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync(ct);
        if (images.Any())
        {
            foreach (var image in images)
            {
                image.CommentId = comment.Id;
            }
            _context.TaskCommentImages.AddRange(images);
        }
        if (files.Any())
        {
            try
            {
                foreach (var file in files)
                {
                    file.CommentId = comment.Id;
                }
                _context.TaskCommentFiles.AddRange(files);
            }
            catch
            {
            }
        }
        await _context.SaveChangesAsync(ct);
        return comment;
    }
    public async Task<TaskComment?> GetByIdAsync(long commentId, CancellationToken ct = default)
    {
        var comment = await _context.TaskComments
            .Include(c => c.User)
            .Include(c => c.TaskCommentImages)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct);
        if (comment != null)
        {
            try
            {
                await _context.Entry(comment)
                    .Collection(c => c.TaskCommentFiles)
                    .LoadAsync(ct);
            }
            catch
            {
            }
        }
        return comment;
    }
    public async Task<List<TaskComment>> GetByTaskIdAsync(long taskId, CancellationToken ct = default)
    {
        var comments = await _context.TaskComments
            .Where(c => c.TaskId == taskId)
            .Include(c => c.User)
            .Include(c => c.TaskCommentImages)
            .Include(c => c.InverseParentComment)
            .ToListAsync(ct);
        foreach (var comment in comments)
        {
            try
            {
                await _context.Entry(comment)
                    .Collection(c => c.TaskCommentFiles)
                    .LoadAsync(ct);
            }
            catch
            {
            }
        }
        return comments;
    }
    public async System.Threading.Tasks.Task UpdateAsync(TaskComment comment, List<TaskCommentImage> newImages, List<TaskCommentFile> newFiles, CancellationToken ct = default)
    {
        if (newImages.Any())
        {
            _context.TaskCommentImages.AddRange(newImages);
        }
        if (newFiles.Any())
        {
            try
            {
                _context.TaskCommentFiles.AddRange(newFiles);
            }
            catch
            {
            }
        }
        _context.Entry(comment).State = EntityState.Modified;
        await _context.SaveChangesAsync(ct);
    }
    public async System.Threading.Tasks.Task DeleteAsync(long commentId, CancellationToken ct = default)
    {
        var comment = await _context.TaskComments
            .Include(c => c.TaskCommentImages)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct);
        if (comment != null)
        {
            _context.TaskCommentImages.RemoveRange(comment.TaskCommentImages);
            try
            {
                await _context.Entry(comment)
                    .Collection(c => c.TaskCommentFiles)
                    .LoadAsync(ct);
                if (comment.TaskCommentFiles.Any())
                {
                    _context.TaskCommentFiles.RemoveRange(comment.TaskCommentFiles);
                }
            }
            catch
            {
            }
            _context.TaskComments.Remove(comment);
            await _context.SaveChangesAsync(ct);
        }
    }
}