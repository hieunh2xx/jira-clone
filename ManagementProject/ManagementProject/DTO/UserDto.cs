namespace ManagementProject.DTO
{
    public class UserDto
    {
        public long Id { get; set; }
        public string EmployeeCode { get; set; } = "";
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string FullName { get; set; } = "";
        public long? DepartmentId { get; set; }
        public string DepartmentName { get; set; } = "";
        public string? AvatarUrl { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<long>? RoleId { get; set; } = new();
        public List<string>? RoleName { get; set; } = new();
        public List<long> TeamIds { get; set; } = new List<long>();
        public string? ProjectRole { get; set; } // Role in project: "keymain", "member", etc.
    }
    public class RegisterUserDto
    {
        public string EmployeeCode { get; set; } = "";
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public long? DepartmentId { get; set; }
        public string? AvatarUrl { get; set; }
        public bool? IsActive { get; set; } = true;
        public List<short>? RoleIds { get; set; }
    }
    public class UserUpdate
    {
        public long Id { get; set; }
        public string EmployeeCode { get; set; } = "";
        public string Email { get; set; } = "";
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public long? DepartmentId { get; set; }
        public string? AvatarUrl{ get; set; }
        public string DepartmentName { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<short>? RoleIds { get; set; }
    }
    public class LoginDTO
    {
        public string? Email { get; set; }
        public string? Username { get; set; }
        public string Password { get; set; }
    }
    public class UpdateUserRoleRequest
    {
        public List<short> RoleIds { get; set; } = new();
    }
}