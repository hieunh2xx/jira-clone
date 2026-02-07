using ManagementProject.DTO;
public interface ITaskService
{
    Task<TaskDetailDto> CreateTaskAsync(CreateTaskDto dto,
        CancellationToken ct = default);
    Task<TaskDetailDto> UpdateTaskAsync(long taskId, UpdateTaskDto dto,
        CancellationToken ct = default);
    Task<TaskDetailDto> GetTaskDetailAsync(long taskId, CancellationToken ct = default);
    Task<KanbanBoardDto> GetKanbanBoardAsync(long projectId, CancellationToken ct = default);
    Task<bool> UpdateTaskStatusOnlyAsync(long taskId, string status, long userId, CancellationToken ct = default);
    Task DeleteTaskAsync(long taskId, CancellationToken ct = default);
    Task<List<TaskDto>> getTaskbyProject(long projectId, CancellationToken ct = default);
}