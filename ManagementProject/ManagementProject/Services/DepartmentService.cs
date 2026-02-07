using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Utils;
using Microsoft.EntityFrameworkCore;
using System.Linq;
namespace ManagementProject.Services;
public class DepartmentService : IDepartmentService
{
    private readonly ProjectManagementDbContext _ctx;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public DepartmentService(ProjectManagementDbContext ctx, IHttpContextAccessor httpContextAccessor)
    {
        _ctx = ctx;
        _httpContextAccessor = httpContextAccessor;
    }
    public async Task<List<DepartmentDto>> GetAllDepartmentsAsync(CancellationToken ct = default)
    {
        var departments = await _ctx.Departments
            .Include(d => d.Manager)
            .Include(d => d.Users)
            .Include(d => d.Teams)
            .ToListAsync(ct);
        return departments.Select(d => new DepartmentDto
        {
            Id = d.Id,
            Name = d.Name,
            Code = d.Code,
            ManagerId = d.ManagerId,
            ManagerName = d.Manager != null ? $"{d.Manager.FirstName} {d.Manager.LastName}".Trim() : null,
            Description = d.Description,
            CreatedAt = d.CreatedAt,
            TotalUsers = d.Users.Count,
            TotalTeams = d.Teams.Count
        }).ToList();
    }
    public async Task<DepartmentDto?> GetDepartmentByIdAsync(long id, CancellationToken ct = default)
    {
        var dept = await _ctx.Departments
            .Include(d => d.Manager)
            .Include(d => d.Users)
            .Include(d => d.Teams)
            .FirstOrDefaultAsync(d => d.Id == id, ct);
        if (dept == null) return null;
        return new DepartmentDto
        {
            Id = dept.Id,
            Name = dept.Name,
            Code = dept.Code,
            ManagerId = dept.ManagerId,
            ManagerName = dept.Manager != null ? $"{dept.Manager.FirstName} {dept.Manager.LastName}".Trim() : null,
            Description = dept.Description,
            CreatedAt = dept.CreatedAt,
            TotalUsers = dept.Users.Count,
            TotalTeams = dept.Teams.Count
        };
    }
    public async Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentRequest dto, CancellationToken ct = default)
    {
        var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _ctx, ct);
        if (userSession == null || !IsSystemAdmin(userSession))
        {
            throw new UnauthorizedAccessException("Chỉ system_admin mới được tạo bộ phận");
        }
        var department = new Department
        {
            Name = dto.Name,
            Code = dto.Code,
            ManagerId = dto.ManagerId,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };
        _ctx.Departments.Add(department);
        await _ctx.SaveChangesAsync(ct);
        return await GetDepartmentByIdAsync(department.Id, ct) ?? throw new InvalidOperationException();
    }
    public async Task<DepartmentDto> UpdateDepartmentAsync(long id, UpdateDepartmentRequest dto, CancellationToken ct = default)
    {
        var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _ctx, ct);
        if (userSession == null || !IsSystemAdmin(userSession))
        {
            throw new UnauthorizedAccessException("Chỉ system_admin mới được cập nhật bộ phận");
        }
        var dept = await _ctx.Departments.FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy bộ phận");
        if (dto.Name != null) dept.Name = dto.Name;
        if (dto.Code != null) dept.Code = dto.Code;
        if (dto.ManagerId.HasValue) dept.ManagerId = dto.ManagerId;
        if (dto.Description != null) dept.Description = dto.Description;
        await _ctx.SaveChangesAsync(ct);
        return await GetDepartmentByIdAsync(id, ct) ?? throw new InvalidOperationException();
    }
    public async System.Threading.Tasks.Task DeleteDepartmentAsync(long id, CancellationToken ct = default)
    {
        var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _ctx, ct);
        if (userSession == null || !IsSystemAdmin(userSession))
        {
            throw new UnauthorizedAccessException("Chỉ system_admin mới được xóa bộ phận");
        }
        var dept = await _ctx.Departments
            .Include(d => d.Users)
            .Include(d => d.Teams)
            .FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy bộ phận");
        if (dept.Users.Any() || dept.Teams.Any())
        {
            throw new InvalidOperationException("Không thể xóa bộ phận đang có người dùng hoặc team");
        }
        _ctx.Departments.Remove(dept);
        await _ctx.SaveChangesAsync(ct);
    }
    public async Task<List<RoleHierarchyDto>> GetRolesForDepartmentAsync(long departmentId, CancellationToken ct = default)
    {
        var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _ctx, ct);
        if (userSession == null || !IsSystemAdmin(userSession))
        {
            throw new UnauthorizedAccessException("Chỉ system_admin mới được xem roles của bộ phận");
        }
        var dept = await _ctx.Departments
            .Include(d => d.Users)
                .ThenInclude(u => u.Roles)
            .FirstOrDefaultAsync(d => d.Id == departmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy bộ phận");
        var allRoles = await _ctx.Roles.OrderBy(r => r.Level).ToListAsync(ct);
        var assignedRoleIds = dept.Users
            .SelectMany(u => u.Roles)
            .Select(r => r.Id)
            .Distinct()
            .ToHashSet();
        return allRoles.Select(r => new RoleHierarchyDto
        {
            Id = r.Id,
            Name = r.Name,
            Level = r.Level,
            Description = r.Description,
            IsAssignedToDepartment = assignedRoleIds.Contains(r.Id)
        }).ToList();
    }
    public async System.Threading.Tasks.Task AssignRolesToDepartmentAsync(AssignRoleToDepartmentRequest dto, CancellationToken ct = default)
    {
        var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _ctx, ct);
        if (userSession == null || !IsSystemAdmin(userSession))
        {
            throw new UnauthorizedAccessException("Chỉ system_admin mới được phân quyền cho bộ phận");
        }
        var dept = await _ctx.Departments
            .Include(d => d.Users)
            .FirstOrDefaultAsync(d => d.Id == dto.DepartmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy bộ phận");
        var roles = await _ctx.Roles
            .Where(r => dto.RoleIds.Contains(r.Id))
            .ToListAsync(ct);
        foreach (var user in dept.Users)
        {
            var userRoles = await _ctx.Entry(user)
                .Collection(u => u.Roles)
                .Query()
                .ToListAsync(ct);
            var rolesToAdd = roles.Where(r => !userRoles.Any(ur => ur.Id == r.Id)).ToList();
            foreach (var role in rolesToAdd)
            {
                user.Roles.Add(role);
            }
        }
        await _ctx.SaveChangesAsync(ct);
    }
    private bool IsSystemAdmin(UserDto user)
    {
        return user.RoleName.Any(r =>
            string.Equals(r?.Trim().ToLowerInvariant(), "system_admin", StringComparison.OrdinalIgnoreCase));
    }
}