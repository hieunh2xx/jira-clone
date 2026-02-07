using DataAccess.Models;
namespace ManagementProject.Repositories
{
    public interface IScrumBoardRepository
    {
        Task<Board> GetBoardWithColumnsAsync(long boardId);
        Task<Sprint> CreateSprintAsync(Sprint sprint);
        System.Threading.Tasks.Task AddTasksToSprintAsync(long sprintId, IEnumerable<long> taskIds);
        System.Threading.Tasks.Task UpdateTaskPositionAsync(long taskId, long boardId, long? columnId, double position);
        Task<TaskBoardPosition> GetTaskPositionAsync(long taskId, long boardId);
        Task<List<TaskBoardPosition>> GetTasksInColumnAsync(long boardId, long columnId);
    }
}