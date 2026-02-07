using DataAccess.Models;
using ManagementProject.Cache;
using ManagementProject.DTO;
using ManagementProject.Utils;
using Microsoft.EntityFrameworkCore;
namespace ManagementProject.Repository
{
    public class AuthRepository : IAuthRepository
    {
        private readonly ProjectManagementDbContext _context;
        private readonly UserCacheService _userCache;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public AuthRepository(
            ProjectManagementDbContext context,
            UserCacheService userCache,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _userCache = userCache;
            _httpContextAccessor = httpContextAccessor;
        }
        public async System.Threading.Tasks.Task DeleteAsync(long id)
        {
            var userSession = JwtUserUtils.GetUserFromClaims(_httpContextAccessor);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                throw new KeyNotFoundException($"User with id {id} not found.");
            var departments = await _context.Departments
                .Where(d => d.ManagerId == id)
                .ToListAsync();
            foreach (var dept in departments)
                dept.ManagerId = null;
            var userTeamAssignments = await _context.UserTeamAssignments
                .Where(uta => uta.UserId == id)
                .ToListAsync();
            if (userTeamAssignments.Any())
                _context.UserTeamAssignments.RemoveRange(userTeamAssignments);
            var taskAssignmentsBy = await _context.TaskAssignments
                .Where(t => t.AssignedBy == id)
                .ToListAsync();
            if (taskAssignmentsBy.Any())
                _context.TaskAssignments.RemoveRange(taskAssignmentsBy);
            var taskAssignmentsUser = await _context.TaskAssignments
                .Where(t => t.UserId == id)
                .ToListAsync();
            if (taskAssignmentsUser.Any())
                _context.TaskAssignments.RemoveRange(taskAssignmentsUser);
            _context.Entry(user).Collection(u => u.Roles).Load();
            if (user.Roles.Any())
                user.Roles.Clear();
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            _userCache.Remove(id);
            _userCache.InvalidateAll();
        }
        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var cached = _userCache.GetAll();
            if (cached != null)
                return cached;
            var users = await _context.Users
                .AsNoTracking()
                .Include(u => u.Roles)
                .Include(u => u.Teams)
                .Include(u => u.Department)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    EmployeeCode = u.EmployeeCode,
                    Username = u.Username,
                    Email = u.Email,
                    FullName = u.FirstName + " " + u.LastName,
                    DepartmentId = u.DepartmentId,
                    DepartmentName = u.Department != null ? u.Department.Name : "",
                    AvatarUrl = u.AvatarUrl,
                    IsActive = u.IsActive ?? false,
                    CreatedAt = u.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = u.UpdatedAt ?? DateTime.MinValue,
                    RoleId = u.Roles.Select(r => (long)r.Id).ToList(),
                    RoleName = u.Roles.Select(r => r.Name).ToList()
                })
                .ToListAsync();
            _userCache.SetAll(users);
            return users;
        }
        public async Task<List<UserDto>> SearchUsersByEmailAsync(string emailKeyword)
        {
            if (string.IsNullOrWhiteSpace(emailKeyword))
                return new List<UserDto>();
            var users = await _context.Users
                .AsNoTracking()
                .Include(u => u.Roles)
                .Include(u => u.Teams)
                .Include(u => u.Department)
                .Where(u => u.Email.Contains(emailKeyword) || 
                           u.Username.Contains(emailKeyword) ||
                           (u.FirstName + " " + u.LastName).Contains(emailKeyword))
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    EmployeeCode = u.EmployeeCode,
                    Username = u.Username,
                    Email = u.Email,
                    FullName = u.FirstName + " " + u.LastName,
                    DepartmentId = u.DepartmentId,
                    DepartmentName = u.Department != null ? u.Department.Name : "",
                    AvatarUrl = u.AvatarUrl,
                    IsActive = u.IsActive ?? false,
                    CreatedAt = u.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = u.UpdatedAt ?? DateTime.MinValue,
                    RoleId = u.Roles.Select(r => (long)r.Id).ToList(),
                    RoleName = u.Roles.Select(r => r.Name).ToList()
                })
                .Take(20)
                .ToListAsync();
            return users;
        }
        public async Task<UserDto?> GetUserByIdAsync(long id)
        {
            var cached = _userCache.Get(id);
            if (cached != null)
                return cached;
            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Roles)
                .Include(u => u.Teams)
                .Include(u => u.Department)
                .Where(u => u.Id == id)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    EmployeeCode = u.EmployeeCode,
                    Username = u.Username,
                    Email = u.Email,
                    FullName = u.FirstName + " " + u.LastName,
                    DepartmentId = u.DepartmentId,
                    DepartmentName = u.Department != null ? u.Department.Name : "",
                    AvatarUrl = u.AvatarUrl,
                    IsActive = u.IsActive ?? false,
                    CreatedAt = u.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = u.UpdatedAt ?? DateTime.MinValue,
                    RoleId = u.Roles.Select(r => (long)r.Id).ToList(),
                    RoleName = u.Roles.Select(r => r.Name).ToList()
                })
                .FirstOrDefaultAsync();
            if (user == null)
                throw new KeyNotFoundException($"Không có user nào có id là {id}!");
            _userCache.Set(user);
            return user;
        }
        public async Task<ResponeSuccess<UserDto>> LoginAsync(string? username, string? email, string password)
        {
            if (string.IsNullOrEmpty(password) ||
               (string.IsNullOrEmpty(username) && string.IsNullOrEmpty(email)))
            {
                return new ResponeSuccess<UserDto>(400, "Username/email và password phải được cung cấp");
            }
            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Roles)
                .Include(u => u.Department)
                .Include(u => u.Teams)
                .FirstOrDefaultAsync(u =>
                    (username != null && u.Username == username && u.PasswordHash == password) ||
                    (email != null && u.Email == email && u.PasswordHash == password)
                );
            if (user == null)
                return new ResponeSuccess<UserDto>(401, "Tài khoản hoặc mật khẩu không chính xác");
            var dto = new UserDto
            {
                Id = user.Id,
                EmployeeCode = user.EmployeeCode,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FirstName + " " + user.LastName,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name ?? "",
                AvatarUrl = user.AvatarUrl,
                IsActive = user.IsActive ?? false,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                RoleId = user.Roles.Select(r => (long)r.Id).ToList(),
                RoleName = user.Roles.Select(r => r.Name).ToList()
            };
            return new ResponeSuccess<UserDto>(200, "Login thành công", dto);
        }
        public async Task<ResponeSuccess<UserDto>> RegisterAsync(RegisterUserDto dto)
        {
            var user = new User
            {
                EmployeeCode = dto.EmployeeCode,
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = dto.Password,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                DepartmentId = dto.DepartmentId,
                AvatarUrl = dto.AvatarUrl,
                IsActive = dto.IsActive
            };
            if (dto.RoleIds != null && dto.RoleIds.Count > 0)
            {
                var roles = await _context.Roles
                    .Where(r => dto.RoleIds.Contains(r.Id))
                    .ToListAsync();
                user.Roles = roles;
            }
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            var userDto = new UserDto
            {
                Id = user.Id,
                EmployeeCode = user.EmployeeCode,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FirstName + " " + user.LastName,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name ?? "",
                AvatarUrl = user.AvatarUrl,
                IsActive = user.IsActive ?? false,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                RoleId = user.Roles.Select(r => (long)r.Id).ToList(),
                RoleName = user.Roles.Select(r => r.Name).ToList()
            };
            _userCache.Set(userDto);
            _userCache.InvalidateAll();
            return new ResponeSuccess<UserDto>(200, "User created successfully", userDto);
        }
        public async Task<UserDto?> UpdateAsync(long id, UserUpdate updatedUser)
        {
            var user = await _context.Users
                .Include(u => u.Roles)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return null;
            user.FirstName = updatedUser.FirstName;
            user.LastName = updatedUser.LastName;
            user.Email = updatedUser.Email;
            user.DepartmentId = updatedUser.DepartmentId;
            user.AvatarUrl = updatedUser.AvatarUrl;
            user.IsActive = updatedUser.IsActive;
            
            // Update roles if provided
            if (updatedUser.RoleIds != null && updatedUser.RoleIds.Any())
            {
                var roles = await _context.Roles
                    .Where(r => updatedUser.RoleIds.Contains(r.Id))
                    .ToListAsync();
                user.Roles.Clear();
                foreach (var role in roles)
                {
                    user.Roles.Add(role);
                }
            }
            
            await _context.SaveChangesAsync();
            var dto = new UserDto
            {
                Id = user.Id,
                EmployeeCode = user.EmployeeCode,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FirstName + " " + user.LastName,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name ?? "",
                AvatarUrl = user.AvatarUrl,
                IsActive = user.IsActive ?? false,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                RoleId = user.Roles.Select(r => (long)r.Id).ToList(),
                RoleName = user.Roles.Select(r => r.Name).ToList()
            };
            _userCache.Set(dto);
            _userCache.InvalidateAll();
            return dto;
        }
        public async Task<UserDto?> UpdateUserRolesAsync(long id, List<short> roleIds)
        {
            // Check authorization - only admin can update roles
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            
            // Check if user is admin
            var roleNames = userSession.RoleName?.Select(r => r?.Trim().ToLowerInvariant()).ToList() ?? new List<string>();
            var isAdmin = roleNames.Any(r => 
                string.Equals(r, "system_admin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "tong_giam_doc", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "tong giam doc", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "tổng giám đốc", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "admin", StringComparison.OrdinalIgnoreCase));
            
            if (!isAdmin)
                throw new UnauthorizedAccessException("Chỉ admin mới có quyền cập nhật role cho user.");
            
            var user = await _context.Users
                .Include(u => u.Roles)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return null;
            
            // Update roles
            if (roleIds != null && roleIds.Any())
            {
                var roles = await _context.Roles
                    .Where(r => roleIds.Contains(r.Id))
                    .ToListAsync();
                user.Roles.Clear();
                foreach (var role in roles)
                {
                    user.Roles.Add(role);
                }
            }
            else
            {
                // If empty list, remove all roles
                user.Roles.Clear();
            }
            
            await _context.SaveChangesAsync();
            var dto = new UserDto
            {
                Id = user.Id,
                EmployeeCode = user.EmployeeCode,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FirstName + " " + user.LastName,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name ?? "",
                AvatarUrl = user.AvatarUrl,
                IsActive = user.IsActive ?? false,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                RoleId = user.Roles.Select(r => (long)r.Id).ToList(),
                RoleName = user.Roles.Select(r => r.Name).ToList()
            };
            _userCache.Set(dto);
            _userCache.InvalidateAll();
            return dto;
        }
    }
}