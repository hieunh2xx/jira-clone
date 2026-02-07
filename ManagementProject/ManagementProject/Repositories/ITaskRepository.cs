using DataAccess.Models;
using ManagementProject.DTO;
namespace ManagementProject.Repositories;
public interface ITaskRepository
{
    Task<DataAccess.Models.Task?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<DataAccess.Models.Task?> GetDetailByIdAsync(long id, CancellationToken ct = default);
    Task<List<DataAccess.Models.Task>> GetByProjectAsync(long projectId, CancellationToken ct = default);
    Task<DataAccess.Models.Task> CreateAsync(DataAccess.Models.Task task, CancellationToken ct = default);
    System.Threading.Tasks.Task UpdateAsync(DataAccess.Models.Task task, CancellationToken ct = default);
    Task<bool> UpdateStatusOnlyAsync(long taskId, string status, CancellationToken ct = default);
    System.Threading.Tasks.Task DeleteAsync(long id, CancellationToken ct = default);
}