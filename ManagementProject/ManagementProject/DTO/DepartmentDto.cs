namespace ManagementProject.DTO;
public class DepartmentDto
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public long? ManagerId { get; set; }
    public string? ManagerName { get; set; }
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }
    public int TotalUsers { get; set; }
    public int TotalTeams { get; set; }
}
public class CreateDepartmentRequest
{
    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public long? ManagerId { get; set; }
    public string? Description { get; set; }
}
public class UpdateDepartmentRequest
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public long? ManagerId { get; set; }
    public string? Description { get; set; }
}
public class AssignRoleToDepartmentRequest
{
    public long DepartmentId { get; set; }
    public List<short> RoleIds { get; set; } = new();
}
public class RoleHierarchyDto
{
    public short Id { get; set; }
    public string Name { get; set; } = null!;
    public byte Level { get; set; }
    public string? Description { get; set; }
    public bool IsAssignedToDepartment { get; set; }
}