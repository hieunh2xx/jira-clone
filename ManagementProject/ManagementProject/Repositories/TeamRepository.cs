using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Utils;
using Microsoft.EntityFrameworkCore;
namespace ManagementProject.Repositories
{
    public class TeamRepository : ITeamRepository
    {
        private readonly ProjectManagementDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public TeamRepository(ProjectManagementDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }
        private bool IsSystemAdmin(UserDto user)
        {
            return user.RoleName.Any(r => 
                string.Equals(r?.Trim().ToLowerInvariant(), "system_admin", StringComparison.OrdinalIgnoreCase));
        }
        private bool IsAdmin(UserDto user)
        {
            // System admin và tổng giám đốc được coi là admin
            var roleNames = user.RoleName?.Select(r => r?.Trim().ToLowerInvariant()).ToList() ?? new List<string>();
            return roleNames.Any(r => 
                string.Equals(r, "system_admin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "tong_giam_doc", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "tong giam doc", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "tổng giám đốc", StringComparison.OrdinalIgnoreCase) ||
                // Backward compatibility with old role names
                string.Equals(r, "admin", StringComparison.OrdinalIgnoreCase));
        }
        private bool CanEditTeam(UserDto user, Team team)
        {
            if (IsAdmin(user)) return true;
            if (team.LeadId == user.Id) return true;
            return false;
        }
        public async Task<List<TeamDTO>> GetAllTeams(string? keyword, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var query = _context.Teams
                .AsNoTracking()
                .Include(t => t.Department)
                .Include(t => t.Lead)
                .Include(t => t.UserTeamAssignments)
                .ThenInclude(uta => uta.User)
                .Select(t => new TeamDTO
                {
                    Id = t.Id,
                    Name = t.Name,
                    Code = t.Code,
                    DepartmentId = t.DepartmentId,
                    DepartmentName = t.Department.Name,
                    LeadId = t.LeadId,
                    LeadName = t.Lead != null ? t.Lead.FirstName + " " + t.Lead.LastName : null,
                    Description = t.Description,
                    CreatedAt = t.CreatedAt,
                    MemberIds = t.UserTeamAssignments.Select(uta => uta.UserId).ToList(),
                    MemberNames = t.UserTeamAssignments.Select(uta => uta.User.FirstName + " " + uta.User.LastName).ToList()
                });
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(t => t.Name.Contains(keyword) || (t.Code != null && t.Code.Contains(keyword)));
            }
            return await query.ToListAsync(ct);
        }
        public async Task<TeamDTO?> GetTeamDetail(long id, CancellationToken ct = default)
        {
            var team = await _context.Teams
                .AsNoTracking()
                .Include(t => t.Department)
                .Include(t => t.Lead)
                .Include(t => t.UserTeamAssignments)
                .ThenInclude(uta => uta.User)
                .Select(t => new TeamDTO
                {
                    Id = t.Id,
                    Name = t.Name,
                    Code = t.Code,
                    DepartmentId = t.DepartmentId,
                    DepartmentName = t.Department.Name,
                    LeadId = t.LeadId,
                    LeadName = t.Lead != null ? t.Lead.FirstName + " " + t.Lead.LastName : null,
                    Description = t.Description,
                    CreatedAt = t.CreatedAt,
                    MemberIds = t.UserTeamAssignments.Select(uta => uta.UserId).ToList(),
                    MemberNames = t.UserTeamAssignments.Select(uta => uta.User.FirstName + " " + uta.User.LastName).ToList()
                })
                .FirstOrDefaultAsync(t => t.Id == id, ct);
            return team;
        }
        public async System.Threading.Tasks.Task AddTeam(TeamCreateDTO dto, CancellationToken ct = default)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null) throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Tên team không được để trống.");
            if (dto.Name.Length > 100)
                throw new ArgumentException("Tên team không được vượt quá 100 ký tự.");
            if (!string.IsNullOrWhiteSpace(dto.Code) && dto.Code.Length > 15)
                throw new ArgumentException("Code team không được vượt quá 15 ký tự.");
            if (!string.IsNullOrWhiteSpace(dto.Code))
            {
                var existingTeam = await _context.Teams
                    .FirstOrDefaultAsync(t => t.Code == dto.Code, ct);
                if (existingTeam != null)
                    throw new ArgumentException($"Code '{dto.Code}' đã tồn tại. Vui lòng chọn code khác.");
            }
            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.Id == dto.DepartmentId, ct);
            if (department == null)
                throw new KeyNotFoundException($"Không tìm thấy department với Id {dto.DepartmentId}.");
            if (dto.LeadId.HasValue)
            {
                var lead = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == dto.LeadId.Value, ct);
                if (lead == null)
                    throw new KeyNotFoundException($"Không tìm thấy user với Id {dto.LeadId.Value}.");
            }
            if (!IsSystemAdmin(userSession) && dto.LeadId != userSession.Id)
                throw new UnauthorizedAccessException("Bạn không có quyền tạo team cho lead này.");
            var team = new Team
            {
                Name = dto.Name,
                Code = dto.Code,
                DepartmentId = dto.DepartmentId,
                LeadId = dto.LeadId,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };
            try
            {
                await _context.Teams.AddAsync(team, ct);
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                if (innerMessage.Contains("UNIQUE KEY constraint") || innerMessage.Contains("duplicate key"))
                {
                    throw new ArgumentException($"Code '{dto.Code}' đã tồn tại. Vui lòng chọn code khác.");
                }
                if (innerMessage.Contains("FOREIGN KEY constraint") || innerMessage.Contains("The INSERT statement conflicted"))
                {
                    if (innerMessage.Contains("department"))
                        throw new KeyNotFoundException($"Không tìm thấy department với Id {dto.DepartmentId}.");
                    if (innerMessage.Contains("lead"))
                        throw new KeyNotFoundException($"Không tìm thấy user với Id {dto.LeadId}.");
                    throw new InvalidOperationException($"Lỗi ràng buộc dữ liệu: {innerMessage}");
                }
                throw new InvalidOperationException($"Lỗi khi lưu Team: {innerMessage}", ex);
            }
        }
        public async System.Threading.Tasks.Task UpdateTeam(long id, TeamUpdateDTO dto, CancellationToken ct = default)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null) throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (team == null) throw new KeyNotFoundException("Không tìm thấy team đó.");
            if (!CanEditTeam(userSession, team))
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa team này.");
            team.Name = dto.Name;
            team.Code = dto.Code;
            team.DepartmentId = dto.DepartmentId;
            team.LeadId = dto.LeadId;
            team.Description = dto.Description;
            await _context.SaveChangesAsync(ct);
        }
        public async System.Threading.Tasks.Task DeleteTeam(long id, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null) throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (team == null) throw new KeyNotFoundException("Không tìm thấy team đó.");
            if (!CanEditTeam(userSession, team))
                throw new UnauthorizedAccessException("Bạn không có quyền xóa team này.");
            _context.Teams.Remove(team);
            await _context.SaveChangesAsync(ct);
        }
        public async System.Threading.Tasks.Task AddTeamMember(long teamId, long userId, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null) throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var team = await _context.Teams
                .Include(t => t.UserTeamAssignments)
                .FirstOrDefaultAsync(t => t.Id == teamId, ct);
            if (team == null) throw new KeyNotFoundException("Không tìm thấy team đó.");
            if (!CanEditTeam(userSession, team))
                throw new UnauthorizedAccessException("Bạn không có quyền thêm member vào team này.");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) throw new KeyNotFoundException("Không tìm thấy user đó.");
            if (team.UserTeamAssignments.Any(uta => uta.UserId == userId))
                throw new InvalidOperationException("User đã là member của team này.");
            if (team.LeadId == userId)
                throw new InvalidOperationException("User này đã là lead của team, không cần thêm vào members.");
            var assignment = new UserTeamAssignment
            {
                TeamId = teamId,
                UserId = userId,
                AssignedAt = DateTime.UtcNow
            };
            try
            {
                await _context.UserTeamAssignments.AddAsync(assignment, ct);
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                if (innerMessage.Contains("UNIQUE KEY constraint") || innerMessage.Contains("duplicate key") || 
                    innerMessage.Contains("PRIMARY KEY") || innerMessage.Contains("Cannot insert duplicate key"))
                {
                    throw new InvalidOperationException("User đã là member của team này.");
                }
                if (innerMessage.Contains("FOREIGN KEY constraint") || innerMessage.Contains("The INSERT statement conflicted"))
                {
                    if (innerMessage.Contains("team"))
                        throw new KeyNotFoundException($"Không tìm thấy team với Id {teamId}.");
                    if (innerMessage.Contains("user") || innerMessage.Contains("Users"))
                        throw new KeyNotFoundException($"Không tìm thấy user với Id {userId}.");
                    throw new InvalidOperationException($"Lỗi ràng buộc dữ liệu: {innerMessage}");
                }
                throw new InvalidOperationException($"Lỗi khi lưu Team Member: {innerMessage}", ex);
            }
        }
        public async System.Threading.Tasks.Task RemoveTeamMember(long teamId, long userId, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null) throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var team = await _context.Teams
                .Include(t => t.UserTeamAssignments)
                .FirstOrDefaultAsync(t => t.Id == teamId, ct);
            if (team == null) throw new KeyNotFoundException("Không tìm thấy team đó.");
            if (!CanEditTeam(userSession, team))
                throw new UnauthorizedAccessException("Bạn không có quyền xóa member khỏi team này.");
            var assignment = team.UserTeamAssignments.FirstOrDefault(uta => uta.UserId == userId);
            if (assignment == null) throw new KeyNotFoundException("User không phải là member của team này.");
            _context.UserTeamAssignments.Remove(assignment);
            await _context.SaveChangesAsync(ct);
        }
    }
}