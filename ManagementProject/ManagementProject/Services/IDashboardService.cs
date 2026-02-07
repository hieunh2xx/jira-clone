using ManagementProject.DTO;
namespace ManagementProject.Services;
public interface IDashboardService
{
    Task<ProjectProgressDto> GetProjectProgressAsync(long projectId, CancellationToken ct = default);
    Task<ProjectSummaryDto> GetProjectSummaryAsync(long projectId, CancellationToken ct = default);
    Task<AllProjectsDashboardDto> GetAllProjectsDashboardAsync(CancellationToken ct = default);
    Task<List<UserTaskDashboardDto>> GetUserTaskDashboardAsync(UserTaskDashboardFilterDto filter, CancellationToken ct = default);
    Task<List<UserDto>> GetAllUsersAsync(CancellationToken ct = default);
    Task<MyDayStatisticsDto> GetMyDayStatisticsAsync(long userId, CancellationToken ct = default);
}