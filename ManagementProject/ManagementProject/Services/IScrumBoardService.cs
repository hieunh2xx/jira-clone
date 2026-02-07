using ManagementProject.DTO;
namespace ManagementProject.Services
{
    public interface IScrumBoardService
    {
        Task<BoardDto> GetScrumBoardAsync(long boardId);
        Task<SprintDto> CreateSprintAsync(CreateSprintRequest request);
        Task AddTasksToSprintAsync(AddTasksToSprintRequest request);
        Task UpdateTaskPositionAsync(UpdateTaskPositionRequest request);
        Task<List<TaskBoardPositionDto>> ReorderTasksInColumn(long boardId, long columnId, List<long> taskIds);
    }
}