using DataAccess.Models;
using ManagementProject.DTO;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using TaskModel = DataAccess.Models.Task;
namespace ManagementProject.Repositories;
public class TaskRepository : ITaskRepository
{
    private readonly ProjectManagementDbContext _context;
    public TaskRepository(ProjectManagementDbContext context) => _context = context;
    public async Task<TaskModel?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.IssueType)
            .Include(t => t.CreatedByNavigation)
            .Include(t => t.TaskAssignments).ThenInclude(ta => ta.User)
            .Include(t => t.Categories)
            .Include(t => t.TaskImages)
            .Include(t => t.TaskFiles)
            .FirstOrDefaultAsync(t => t.Id == id, ct);
    public async Task<TaskModel?> GetDetailByIdAsync(long id, CancellationToken ct = default)
        => await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Epic)
            .Include(t => t.IssueType)
            .Include(t => t.CreatedByNavigation)
            .Include(t => t.ParentTask)
            .Include(t => t.TaskAssignments).ThenInclude(ta => ta.User)
            .Include(t => t.Categories)
            .Include(t => t.TaskImages)
            .Include(t => t.TaskFiles)
            .Include(t => t.TaskCustomValues).ThenInclude(tcv => tcv.CustomField)
            .Include(t => t.TaskComments).ThenInclude(c => c.User)
            .Include(t => t.TaskComments).ThenInclude(c => c.TaskCommentImages)
            .Include(t => t.TaskComments).ThenInclude(c => c.InverseParentComment)
            .FirstOrDefaultAsync(t => t.Id == id, ct);
    public async Task<List<TaskModel>> GetByProjectAsync(long projectId, CancellationToken ct = default)
        => await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Project)
            .Include(t => t.IssueType)
            .Include(t => t.CreatedByNavigation)
            .Include(t => t.TaskAssignments).ThenInclude(ta => ta.User)
            .Include(t => t.Categories)
            .ToListAsync(ct);
    public async Task<TaskModel> CreateAsync(TaskModel task, CancellationToken ct = default)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(ct);
        return task;
    }
    public async System.Threading.Tasks.Task UpdateAsync(TaskModel task, CancellationToken ct = default)
    {
        _context.Entry(task).State = EntityState.Modified;
        await _context.SaveChangesAsync(ct);
    }
    public async Task<bool> UpdateStatusOnlyAsync(long taskId, string status, CancellationToken ct = default)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId, ct);
        if (task == null || task.Status == status) return task != null;
        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;
        return await _context.SaveChangesAsync(ct) > 0;
    }
    public async System.Threading.Tasks.Task DeleteAsync(long id, CancellationToken ct = default)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task != null)
        {
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync(ct);
        }
    }
}