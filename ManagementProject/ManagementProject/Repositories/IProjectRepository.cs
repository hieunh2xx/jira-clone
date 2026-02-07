using ManagementProject.DTO;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
namespace ManagementProject.Repositories
{
    public interface IProjectRepository
    {
        Task<List<ProjectDTO>> GetAllProject(string? keyword, CancellationToken ct = default);
        Task<PagedResultDto<ProjectDTO>> GetAllProjectPaged(string? keyword, int page = 1, int pageSize = 10, CancellationToken ct = default);
        Task<ProjectDTO?> GetProjectDetail(long id, CancellationToken ct = default);
        Task<List<ProjectDTO>> GetProjectByUser(CancellationToken ct = default);
        Task AddProject(ProjectCreateDTO dto, CancellationToken ct = default);
        Task UpdateProject(int id, ProjectUpdateDTO dto, CancellationToken ct = default);
        Task DeleteProject(int id, CancellationToken ct = default);
        Task CompleteProject(long id, CancellationToken ct = default);
        Task ReopenProject(long id, CancellationToken ct = default);
        Task AddProjectMember(long projectId, long userId, CancellationToken ct = default);
        Task RemoveProjectMember(long projectId, long userId, CancellationToken ct = default);
        Task<List<UserDto>> GetProjectMembers(long projectId, CancellationToken ct = default);
        Task GrantKeyMainPermission(long projectId, long userId, CancellationToken ct = default);
        Task RevokeKeyMainPermission(long projectId, long userId, CancellationToken ct = default);
    }
}