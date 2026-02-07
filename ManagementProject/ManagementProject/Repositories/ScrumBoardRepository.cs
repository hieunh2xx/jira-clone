using DataAccess.Models;
using Microsoft.EntityFrameworkCore;
namespace ManagementProject.Repositories
{
    public class ScrumBoardRepository : IScrumBoardRepository
    {
        private readonly ProjectManagementDbContext _context;
        public ScrumBoardRepository(ProjectManagementDbContext context) => _context = context;
        public async Task<Board> GetBoardWithColumnsAsync(long boardId)
        {
            return await _context.Boards
                .Include(b => b.BoardColumns)
                .FirstOrDefaultAsync(b => b.Id == boardId && b.Type == "scrum" && b.IsActive == true);
        }
        public async Task<Sprint> CreateSprintAsync(Sprint sprint)
        {
            _context.Sprints.Add(sprint);
            await _context.SaveChangesAsync();
            return sprint;
        }
        public async System.Threading.Tasks.Task AddTasksToSprintAsync(long sprintId, IEnumerable<long> taskIds)
        {
            var entries = taskIds.Select(t => new SprintTask
            {
                SprintId = sprintId,
                TaskId = t,
                AddedAt = DateTime.UtcNow
            });
            _context.SprintTasks.AddRange(entries);
            await _context.SaveChangesAsync();
        }
        public async System.Threading.Tasks.Task UpdateTaskPositionAsync(long taskId, long boardId, long? columnId, double position)
        {
            var pos = await _context.TaskBoardPositions
                .FirstOrDefaultAsync(p => p.TaskId == taskId && p.BoardId == boardId);
            if (pos == null)
            {
                pos = new TaskBoardPosition
                {
                    TaskId = taskId,
                    BoardId = boardId,
                    ColumnId = columnId,
                    Position = position
                };
                _context.TaskBoardPositions.Add(pos);
            }
            else
            {
                pos.ColumnId = columnId;
                pos.Position = position;
            }
            await _context.SaveChangesAsync();
        }
        public async Task<TaskBoardPosition> GetTaskPositionAsync(long taskId, long boardId)
        {
            return await _context.TaskBoardPositions
                .FirstOrDefaultAsync(p => p.TaskId == taskId && p.BoardId == boardId);
        }
        public async Task<List<TaskBoardPosition>> GetTasksInColumnAsync(long boardId, long columnId)
        {
            return await _context.TaskBoardPositions
                .Where(p => p.BoardId == boardId && p.ColumnId == columnId)
                .OrderBy(p => p.Position)
                .ToListAsync();
        }
    }
}