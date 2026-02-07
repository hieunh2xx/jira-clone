using ManagementProject.DTO;
namespace ManagementProject.Services;
public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetAllDepartmentsAsync(CancellationToken ct = default);
    Task<DepartmentDto?> GetDepartmentByIdAsync(long id, CancellationToken ct = default);
    Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentRequest dto, CancellationToken ct = default);
    Task<DepartmentDto> UpdateDepartmentAsync(long id, UpdateDepartmentRequest dto, CancellationToken ct = default);
    System.Threading.Tasks.Task DeleteDepartmentAsync(long id, CancellationToken ct = default);
    Task<List<RoleHierarchyDto>> GetRolesForDepartmentAsync(long departmentId, CancellationToken ct = default);
    System.Threading.Tasks.Task AssignRolesToDepartmentAsync(AssignRoleToDepartmentRequest dto, CancellationToken ct = default);
}