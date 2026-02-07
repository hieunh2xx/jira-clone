using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Utils;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
namespace ManagementProject.Repositories
{
    public class ProjectRepository : IProjectRepository
    {
        private readonly ProjectManagementDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ProjectRepository(ProjectManagementDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }
        #region Helpers
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
        private bool CanViewAllProjects(UserDto user)
        {
            // System admin, tổng giám đốc, trưởng phòng có thể xem tất cả dự án
            if (IsSystemAdmin(user))
                return true;
            
            if (IsAdmin(user))
                return true;
            
            var roleNames = user.RoleName?.Select(r => r?.Trim().ToLowerInvariant()).ToList() ?? new List<string>();
            
            // Trưởng phòng có thể xem tất cả dự án
            if (roleNames.Any(r => 
                string.Equals(r, "truong_phong", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "trưởng phòng", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "truong phong", StringComparison.OrdinalIgnoreCase) ||
                // Backward compatibility
                string.Equals(r, "project_manager", StringComparison.OrdinalIgnoreCase)))
                return true;
            
            return false;
        }
        private bool CanEditProject(UserDto user, Project project)
        {
            // System admin, tổng giám đốc, trưởng phòng có thể edit
            if (IsAdmin(user))
                return true;
            
            var roleNames = user.RoleName?.Select(r => r?.Trim().ToLowerInvariant()).ToList() ?? new List<string>();
            if (roleNames.Any(r => 
                string.Equals(r, "truong_phong", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "trưởng phòng", StringComparison.OrdinalIgnoreCase)))
                return true;
            
            // Project creator có thể edit
            if (project.CreatedBy == user.Id)
                return true;
            
            // Check if user has keymain permission
            if (HasKeyMainPermission(user, project.Id))
                return true;
            
            var team = _context.Teams.Include(t => t.UserTeamAssignments).FirstOrDefault(t => t.Id == project.TeamId);
            if (team == null)
                return false;
            
            // Trưởng bộ phận (team lead) có thể edit
            if (team.LeadId == user.Id)
                return true;
            
            // Phó bộ phận có thể edit
            if (roleNames.Any(r => 
                string.Equals(r, "pho_bo_phan", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "phó bộ phận", StringComparison.OrdinalIgnoreCase)))
            {
                if (team.UserTeamAssignments.Any(uta => uta.UserId == user.Id))
                    return true;
            }
            
            // Team members có thể edit nếu là member của team
            if (team.UserTeamAssignments.Any(uta => uta.UserId == user.Id))
                return true;
            
            return false;
        }
        private bool CanDeleteProject(UserDto user, Project project)
        {
            // System admin, tổng giám đốc có thể xóa tất cả dự án
            if (IsAdmin(user))
                return true;
            
            var roleNames = user.RoleName?.Select(r => r?.Trim().ToLowerInvariant()).ToList() ?? new List<string>();
            
            // Trưởng phòng: Xóa được dự án của phòng ban mình
            if (roleNames.Any(r => 
                string.Equals(r, "truong_phong", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "trưởng phòng", StringComparison.OrdinalIgnoreCase)))
            {
                var team = _context.Teams
                    .Include(t => t.Department)
                    .FirstOrDefault(t => t.Id == project.TeamId);
                if (team != null && team.Department != null && team.Department.ManagerId == user.Id)
                    return true;
            }
            
            // Trưởng bộ phận: Xóa được dự án của bộ phận mình (team lead)
            if (roleNames.Any(r => 
                string.Equals(r, "truong_bo_phan", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "trưởng bộ phận", StringComparison.OrdinalIgnoreCase)))
            {
                var team = _context.Teams.FirstOrDefault(t => t.Id == project.TeamId);
                if (team != null && team.LeadId == user.Id)
                    return true;
            }
            
            // Phó bộ phận, Nhân viên, Cố vấn: Chỉ xóa được dự án mình tạo ra
            if (roleNames.Any(r => 
                string.Equals(r, "pho_bo_phan", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "phó bộ phận", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "nhan_vien", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "nhân viên", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "co_van", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r, "cố vấn", StringComparison.OrdinalIgnoreCase)))
            {
                if (project.CreatedBy == user.Id)
                    return true;
            }
            
            // Project creator (leader) can delete (cho các role khác)
            if (project.CreatedBy == user.Id)
                return true;
            
            // Check if user has keymain permission for this project
            var assignment = _context.UserProjectAssignments
                .FirstOrDefault(upa => upa.ProjectId == project.Id && upa.UserId == user.Id);
            if (assignment != null && string.Equals(assignment.Role?.Trim(), "keymain", StringComparison.OrdinalIgnoreCase))
                return true;
            
            return false;
        }
        private bool HasKeyMainPermission(UserDto user, long projectId)
        {
            var assignment = _context.UserProjectAssignments
                .FirstOrDefault(upa => upa.ProjectId == projectId && upa.UserId == user.Id);
            return assignment != null && string.Equals(assignment.Role?.Trim(), "keymain", StringComparison.OrdinalIgnoreCase);
        }
        #endregion
        public async Task<List<ProjectDTO>> GetAllProject(string? keyword, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var query = _context.Projects
                .AsNoTracking()
                .Include(p => p.Team)
                .ThenInclude(t => t.Department)
                .Include(p => p.CreatedByNavigation)
                .Select(p => new ProjectDTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    Code = p.Code,
                    Description = p.Description,
                    TeamId = p.TeamId,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    DueDate = p.DueDate,
                    CreatedBy = p.CreatedBy,
                    CreateedName = p.CreatedByNavigation.FirstName + " " + p.CreatedByNavigation.LastName,
                    CreatedAt = p.CreatedAt,
                    TeamName = p.Team != null ? p.Team.Name : "",
                    DepartmentName = p.Team != null && p.Team.Department != null ? p.Team.Department.Name : null,
                    IsCompleted = p.IsCompleted,
                    CompletedAt = p.CompletedAt,
                    RequiresEvaluation = p.RequiresEvaluation
                });
            // Admin và tổng giám đốc có thể xem tất cả dự án
            if (!CanViewAllProjects(userSession))
            {
                // Filter projects where user is team lead or team member
                // Use direct OR conditions to avoid SQL OPENJSON issues
                query = query.Where(p => 
                    _context.Teams.Any(t => t.Id == p.TeamId && t.LeadId == userSession.Id) ||
                    _context.UserTeamAssignments.Any(uta => uta.TeamId == p.TeamId && uta.UserId == userSession.Id)
                );
            }
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(p =>
                    p.Name.Contains(keyword) ||
                    p.Code.Contains(keyword) ||
                    (p.TeamName != null && p.TeamName.Contains(keyword))
                );
            }
            return await query.ToListAsync(ct);
        }
        public async Task<PagedResultDto<ProjectDTO>> GetAllProjectPaged(string? keyword, int page = 1, int pageSize = 10, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var query = _context.Projects
                .AsNoTracking()
                .Include(p => p.Team)
                .ThenInclude(t => t.Department)
                .Include(p => p.CreatedByNavigation)
                .Select(p => new ProjectDTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    Code = p.Code,
                    Description = p.Description,
                    TeamId = p.TeamId,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    DueDate = p.DueDate,
                    CreatedBy = p.CreatedBy,
                    CreateedName = p.CreatedByNavigation.FirstName + " " + p.CreatedByNavigation.LastName,
                    CreatedAt = p.CreatedAt,
                    TeamName = p.Team != null ? p.Team.Name : "",
                    DepartmentName = p.Team != null && p.Team.Department != null ? p.Team.Department.Name : null,
                    IsCompleted = p.IsCompleted,
                    CompletedAt = p.CompletedAt,
                    RequiresEvaluation = p.RequiresEvaluation
                });
            // Admin và tổng giám đốc có thể xem tất cả dự án
            if (!CanViewAllProjects(userSession))
            {
                // Filter projects where user is team lead or team member
                // Use direct OR conditions to avoid SQL OPENJSON issues
                query = query.Where(p => 
                    _context.Teams.Any(t => t.Id == p.TeamId && t.LeadId == userSession.Id) ||
                    _context.UserTeamAssignments.Any(uta => uta.TeamId == p.TeamId && uta.UserId == userSession.Id)
                );
            }
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(p =>
                    p.Name.Contains(keyword) ||
                    p.Code.Contains(keyword) ||
                    (p.TeamName != null && p.TeamName.Contains(keyword))
                );
            }
            var totalCount = await query.CountAsync(ct);
            var items = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);
            return new PagedResultDto<ProjectDTO>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }
        public async Task<ProjectDTO?> GetProjectDetail(long id, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var project = await _context.Projects
                .AsNoTracking()
                .Include(p => p.Team)
                .ThenInclude(t => t.Department)
                .Include(p => p.CreatedByNavigation)
                .FirstOrDefaultAsync(p => p.Id == id, ct);
            if (project == null)
                return null;
            // Check if project requires evaluation and user has evaluated
            // Project leader (creator) doesn't need to evaluate
            var isProjectLeader = project.CreatedBy == userSession.Id;
            if (project.RequiresEvaluation == true && !IsAdmin(userSession) && !isProjectLeader)
            {
                var hasEvaluated = await _context.ProjectEvaluations
                    .AnyAsync(e => e.ProjectId == id && e.UserId == userSession.Id, ct);
                if (!hasEvaluated)
                {
                    // Return limited info - user must evaluate first
                    return new ProjectDTO
                    {
                        Id = project.Id,
                        Name = project.Name,
                        Code = project.Code,
                        Description = "Bạn cần đánh giá dự án này trước khi xem thông tin chi tiết.",
                        TeamId = project.TeamId,
                        Status = project.Status,
                        StartDate = project.StartDate,
                        DueDate = project.DueDate,
                        CreatedBy = project.CreatedBy,
                        CreateedName = project.CreatedByNavigation != null ? project.CreatedByNavigation.FirstName + " " + project.CreatedByNavigation.LastName : null,
                        CreatedAt = project.CreatedAt,
                        TeamName = project.Team != null ? project.Team.Name : "",
                        DepartmentName = project.Team != null && project.Team.Department != null ? project.Team.Department.Name : null,
                        IsCompleted = project.IsCompleted,
                        CompletedAt = project.CompletedAt,
                        RequiresEvaluation = project.RequiresEvaluation
                    };
                }
            }
            return new ProjectDTO
            {
                Id = project.Id,
                Name = project.Name,
                Code = project.Code,
                Description = project.Description,
                TeamId = project.TeamId,
                Status = project.Status,
                StartDate = project.StartDate,
                DueDate = project.DueDate,
                CreatedBy = project.CreatedBy,
                CreateedName = project.CreatedByNavigation != null ? project.CreatedByNavigation.FirstName + " " + project.CreatedByNavigation.LastName : null,
                CreatedAt = project.CreatedAt,
                TeamName = project.Team != null ? project.Team.Name : "",
                DepartmentName = project.Team != null && project.Team.Department != null ? project.Team.Department.Name : null,
                IsCompleted = project.IsCompleted,
                CompletedAt = project.CompletedAt,
                RequiresEvaluation = project.RequiresEvaluation
            };
        }
        public async Task<List<ProjectDTO>> GetProjectByUser(CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var query = _context.Projects
                .AsNoTracking()
                .Include(p => p.Team)
                .ThenInclude(t => t.Department)
                .Include(p => p.CreatedByNavigation)
                .Select(p => new ProjectDTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    Code = p.Code,
                    Description = p.Description,
                    TeamId = p.TeamId,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    DueDate = p.DueDate,
                    CreatedBy = p.CreatedBy,
                    CreateedName = p.CreatedByNavigation.FirstName + " " + p.CreatedByNavigation.LastName,
                    CreatedAt = p.CreatedAt,
                    TeamName = p.Team != null ? p.Team.Name : "",
                    DepartmentName = p.Team != null && p.Team.Department != null ? p.Team.Department.Name : null,
                    IsCompleted = p.IsCompleted,
                    CompletedAt = p.CompletedAt,
                    RequiresEvaluation = p.RequiresEvaluation
                });
            // Admin và tổng giám đốc có thể xem tất cả dự án
            if (!CanViewAllProjects(userSession))
            {
                // Chỉ hiển thị dự án khi user là project member (có trong UserProjectAssignments)
                // Nếu user bị xóa khỏi project members, dự án sẽ không hiển thị trong sidebar
                query = query.Where(p => 
                    _context.UserProjectAssignments.Any(upa => upa.ProjectId == p.Id && upa.UserId == userSession.Id)
                );
            }
            return await query.ToListAsync(ct);
        }
        public async System.Threading.Tasks.Task AddProject(ProjectCreateDTO dto, CancellationToken ct = default)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto), "Dữ liệu ProjectCreateDTO không được null.");
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var team = await _context.Teams
                .Include(t => t.UserTeamAssignments)
                .Include(t => t.Department)
                .FirstOrDefaultAsync(t => t.Id == dto.TeamId, ct);
            if (team == null)
                throw new KeyNotFoundException($"Team với Id {dto.TeamId} không tồn tại.");
            
            // Cho phép tất cả role tạo project (không cần check quyền team lead nữa)
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Tên project không được để trống.");
            var project = new Project
            {
                Name = dto.Name,
                Code = dto.Code,
                Description = dto.Description,
                TeamId = dto.TeamId,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "active" : dto.Status,
                StartDate = dto.StartDate,
                DueDate = dto.DueDate,
                CreatedBy = userSession.Id,
                CreatedAt = DateTime.UtcNow
            };
            try
            {
                await _context.Projects.AddAsync(project, ct);
                await _context.SaveChangesAsync(ct);
                
                var projectMembers = new List<UserProjectAssignment>();
                var memberIdsToAdd = new HashSet<long>();
                
                // Priority 1: If DepartmentId is provided, add all users from that department
                if (dto.DepartmentId.HasValue)
                {
                    var departmentUsers = await _context.Users
                        .Where(u => u.DepartmentId == dto.DepartmentId.Value && u.IsActive == true)
                        .Select(u => u.Id)
                        .ToListAsync(ct);
                    
                    foreach (var userId in departmentUsers)
                    {
                        memberIdsToAdd.Add(userId);
                    }
                }
                
                // Priority 2: If MemberIds are provided, add selected members
                if (dto.MemberIds != null && dto.MemberIds.Any())
                {
                    foreach (var userId in dto.MemberIds)
                    {
                        memberIdsToAdd.Add(userId);
                    }
                }
                
                // Priority 3: If neither DepartmentId nor MemberIds provided, add all team members (default behavior)
                if (!dto.DepartmentId.HasValue && (dto.MemberIds == null || !dto.MemberIds.Any()))
                {
                    // Add team lead if exists
                    if (team.LeadId.HasValue)
                    {
                        memberIdsToAdd.Add(team.LeadId.Value);
                    }
                    
                    // Add all team members
                    foreach (var teamMember in team.UserTeamAssignments)
                    {
                        memberIdsToAdd.Add(teamMember.UserId);
                    }
                }
                
                // Always add project creator to the project (if not already added)
                memberIdsToAdd.Add(userSession.Id);
                
                // Create project member assignments
                foreach (var userId in memberIdsToAdd)
                {
                    // Project creator gets "keymain" role by default, others get null (regular member)
                    var role = userId == userSession.Id ? "keymain" : null;
                    projectMembers.Add(new UserProjectAssignment
                    {
                        ProjectId = project.Id,
                        UserId = userId,
                        AssignedAt = DateTime.UtcNow,
                        Role = role
                    });
                }
                
                if (projectMembers.Any())
                {
                    await _context.UserProjectAssignments.AddRangeAsync(projectMembers, ct);
                    await _context.SaveChangesAsync(ct);
                }
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                throw new InvalidOperationException($"Lỗi khi lưu Project: {innerMessage}", ex);
            }
        }
        public async System.Threading.Tasks.Task UpdateProject(int id, ProjectUpdateDTO dto, CancellationToken ct = default)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            if (!CanEditProject(userSession, project))
                throw new UnauthorizedAccessException("Bạn không có quyền để chỉnh sửa project này.");
            project.Name = dto.Name;
            project.Code = dto.Code;
            project.Description = dto.Description;
            project.Status = dto.Status;
            project.StartDate = dto.StartDate;
            project.DueDate = dto.DueDate;
            await _context.SaveChangesAsync(ct);
        }
        public async System.Threading.Tasks.Task DeleteProject(int id, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id, ct);
            
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            
            if (!CanDeleteProject(userSession, project))
                throw new UnauthorizedAccessException("Bạn không có quyền để xóa project này. Chỉ admin hoặc leader của dự án mới có thể xóa.");
            
            // Use transaction to ensure all deletes happen atomically
            using var transaction = await _context.Database.BeginTransactionAsync(ct);
            try
            {
                // Delete related data in correct order to avoid foreign key constraints
                // Use LINQ with direct joins/where clauses instead of Contains() to avoid OPENJSON issues
                
                // 1. Delete task comment files and images first (deepest level)
                // Use Join to avoid Contains() and OPENJSON
                var taskCommentFilesToDelete = await (from tcf in _context.TaskCommentFiles
                                                     join tc in _context.TaskComments on tcf.CommentId equals tc.Id
                                                     join t in _context.Tasks on tc.TaskId equals t.Id
                                                     where t.ProjectId == id
                                                     select tcf).ToListAsync(ct);
                _context.TaskCommentFiles.RemoveRange(taskCommentFilesToDelete);
                
                var taskCommentImagesToDelete = await (from tci in _context.TaskCommentImages
                                                      join tc in _context.TaskComments on tci.CommentId equals tc.Id
                                                      join t in _context.Tasks on tc.TaskId equals t.Id
                                                      where t.ProjectId == id
                                                      select tci).ToListAsync(ct);
                _context.TaskCommentImages.RemoveRange(taskCommentImagesToDelete);
                
                // 2. Delete task comments
                var taskCommentsToDelete = await (from tc in _context.TaskComments
                                                 join t in _context.Tasks on tc.TaskId equals t.Id
                                                 where t.ProjectId == id
                                                 select tc).ToListAsync(ct);
                _context.TaskComments.RemoveRange(taskCommentsToDelete);
                
                // 3. Delete task assignments
                var taskAssignmentsToDelete = await (from ta in _context.TaskAssignments
                                                    join t in _context.Tasks on ta.TaskId equals t.Id
                                                    where t.ProjectId == id
                                                    select ta).ToListAsync(ct);
                _context.TaskAssignments.RemoveRange(taskAssignmentsToDelete);
                
                // 4. Delete task files
                var taskFilesToDelete = await (from tf in _context.TaskFiles
                                               join t in _context.Tasks on tf.TaskId equals t.Id
                                               where t.ProjectId == id
                                               select tf).ToListAsync(ct);
                _context.TaskFiles.RemoveRange(taskFilesToDelete);
                
                // 5. Delete task images
                var taskImagesToDelete = await (from ti in _context.TaskImages
                                               join t in _context.Tasks on ti.TaskId equals t.Id
                                               where t.ProjectId == id
                                               select ti).ToListAsync(ct);
                _context.TaskImages.RemoveRange(taskImagesToDelete);
                
                // 6. Delete task histories
                var taskHistoriesToDelete = await (from th in _context.TaskHistories
                                                   join t in _context.Tasks on th.TaskId equals t.Id
                                                   where t.ProjectId == id
                                                   select th).ToListAsync(ct);
                _context.TaskHistories.RemoveRange(taskHistoriesToDelete);
                
                // 7. Delete task custom values
                var taskCustomValuesToDelete = await (from tcv in _context.TaskCustomValues
                                                     join t in _context.Tasks on tcv.TaskId equals t.Id
                                                     where t.ProjectId == id
                                                     select tcv).ToListAsync(ct);
                _context.TaskCustomValues.RemoveRange(taskCustomValuesToDelete);
                
                // 8. Delete task board positions
                var taskBoardPositionsToDelete = await (from tbp in _context.TaskBoardPositions
                                                        join t in _context.Tasks on tbp.TaskId equals t.Id
                                                        where t.ProjectId == id
                                                        select tbp).ToListAsync(ct);
                _context.TaskBoardPositions.RemoveRange(taskBoardPositionsToDelete);
                
                // 9. Delete sprint tasks
                var sprintTasksToDelete = await (from st in _context.SprintTasks
                                                join t in _context.Tasks on st.TaskId equals t.Id
                                                where t.ProjectId == id
                                                select st).ToListAsync(ct);
                _context.SprintTasks.RemoveRange(sprintTasksToDelete);
                
                // 10. Delete tasks
                var tasksToDelete = await _context.Tasks
                    .Where(t => t.ProjectId == id)
                    .ToListAsync(ct);
                _context.Tasks.RemoveRange(tasksToDelete);
                
                // 11. Delete boards
                var boardsToDelete = await _context.Boards
                    .Where(b => b.ProjectId == id)
                    .ToListAsync(ct);
                _context.Boards.RemoveRange(boardsToDelete);
                
                // 12. Delete epics
                var epicsToDelete = await _context.Epics
                    .Where(e => e.ProjectId == id)
                    .ToListAsync(ct);
                _context.Epics.RemoveRange(epicsToDelete);
                
                // 13. Delete custom fields
                var customFieldsToDelete = await _context.CustomFields
                    .Where(cf => cf.ProjectId == id)
                    .ToListAsync(ct);
                _context.CustomFields.RemoveRange(customFieldsToDelete);
                
                // 14. Delete workflow schemes
                var workflowSchemesToDelete = await _context.WorkflowSchemes
                    .Where(ws => ws.ProjectId == id)
                    .ToListAsync(ct);
                _context.WorkflowSchemes.RemoveRange(workflowSchemesToDelete);
                
                // 15. Delete project evaluations
                var projectEvaluationsToDelete = await _context.ProjectEvaluations
                    .Where(pe => pe.ProjectId == id)
                    .ToListAsync(ct);
                _context.ProjectEvaluations.RemoveRange(projectEvaluationsToDelete);
                
                // 16. Delete project improvements
                var projectImprovementsToDelete = await _context.ProjectImprovements
                    .Where(pi => pi.ProjectId == id)
                    .ToListAsync(ct);
                _context.ProjectImprovements.RemoveRange(projectImprovementsToDelete);
                
                // 17. Delete project trial evaluations
                var projectTrialEvaluationsToDelete = await _context.ProjectTrialEvaluations
                    .Where(pte => pte.ProjectId == id)
                    .ToListAsync(ct);
                _context.ProjectTrialEvaluations.RemoveRange(projectTrialEvaluationsToDelete);
                
                // 18. Delete project images
                var projectImagesToDelete = await _context.ProjectImages
                    .Where(pi => pi.ProjectId == id)
                    .ToListAsync(ct);
                _context.ProjectImages.RemoveRange(projectImagesToDelete);
                
                // 19. Delete project processes
                var projectProcessesToDelete = await _context.ProjectProcesses
                    .Where(pp => pp.ProjectId == id)
                    .ToListAsync(ct);
                _context.ProjectProcesses.RemoveRange(projectProcessesToDelete);
                
                // 20. Delete user project assignments
                var userProjectAssignmentsToDelete = await _context.UserProjectAssignments
                    .Where(upa => upa.ProjectId == id)
                    .ToListAsync(ct);
                _context.UserProjectAssignments.RemoveRange(userProjectAssignmentsToDelete);
                
                // 21. Delete notifications related to this project
                var notificationsToDelete = await _context.Notifications
                    .Where(n => n.ProjectId == id)
                    .ToListAsync(ct);
                _context.Notifications.RemoveRange(notificationsToDelete);
                
                // 22. Finally, delete the project itself
                // Use ExecuteSqlRaw to avoid OUTPUT clause issue with triggers
                // EF Core's Remove() + SaveChanges() uses OUTPUT clause which conflicts with triggers
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM [Projects] WHERE [id] = {0}",
                    new object[] { id },
                    ct);
                
                await transaction.CommitAsync(ct);
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }
        public async System.Threading.Tasks.Task CompleteProject(long id, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var project = await _context.Projects
                .Include(p => p.Team)
                    .ThenInclude(t => t!.UserTeamAssignments)
                .FirstOrDefaultAsync(p => p.Id == id, ct);
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            if (!CanEditProject(userSession, project))
                throw new UnauthorizedAccessException("Bạn không có quyền để hoàn thành project này.");
            project.IsCompleted = true;
            project.CompletedAt = DateTime.UtcNow;
            project.RequiresEvaluation = true;
            await _context.SaveChangesAsync(ct);
        }
        public async System.Threading.Tasks.Task ReopenProject(long id, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var project = await _context.Projects
                .Include(p => p.Team)
                    .ThenInclude(t => t!.UserTeamAssignments)
                .FirstOrDefaultAsync(p => p.Id == id, ct);
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            if (!CanEditProject(userSession, project))
                throw new UnauthorizedAccessException("Bạn không có quyền để mở lại project này.");
            project.IsCompleted = false;
            project.CompletedAt = null;
            project.RequiresEvaluation = false;
            await _context.SaveChangesAsync(ct);
        }
        public async System.Threading.Tasks.Task AddProjectMember(long projectId, long userId, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var project = await _context.Projects
                .Include(p => p.UserProjectAssignments)
                .FirstOrDefaultAsync(p => p.Id == projectId, ct);
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            if (!CanEditProject(userSession, project))
                throw new UnauthorizedAccessException("Bạn không có quyền thêm member vào project này.");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy user đó.");
            if (project.UserProjectAssignments.Any(upa => upa.UserId == userId))
                throw new InvalidOperationException("User đã là member của project này.");
            var assignment = new UserProjectAssignment
            {
                ProjectId = projectId,
                UserId = userId,
                AssignedAt = DateTime.UtcNow
            };
            await _context.UserProjectAssignments.AddAsync(assignment, ct);
            await _context.SaveChangesAsync(ct);
        }
        public async System.Threading.Tasks.Task RemoveProjectMember(long projectId, long userId, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            var project = await _context.Projects
                .Include(p => p.UserProjectAssignments)
                .FirstOrDefaultAsync(p => p.Id == projectId, ct);
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            if (!CanEditProject(userSession, project))
                throw new UnauthorizedAccessException("Bạn không có quyền xóa member khỏi project này.");
            var assignment = await _context.UserProjectAssignments
                .FirstOrDefaultAsync(upa => upa.ProjectId == projectId && upa.UserId == userId, ct);
            if (assignment == null)
                throw new KeyNotFoundException("User không phải là member của project này.");
            _context.UserProjectAssignments.Remove(assignment);
            await _context.SaveChangesAsync(ct);
        }
        public async Task<List<UserDto>> GetProjectMembers(long projectId, CancellationToken ct = default)
        {
            var project = await _context.Projects
                .Include(p => p.UserProjectAssignments)
                    .ThenInclude(upa => upa.User)
                        .ThenInclude(u => u.Department)
                .FirstOrDefaultAsync(p => p.Id == projectId, ct);
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            return project.UserProjectAssignments
                .Select(upa => new UserDto
                {
                    Id = upa.User.Id,
                    Username = upa.User.Username,
                    Email = upa.User.Email,
                    FullName = upa.User.FirstName + " " + upa.User.LastName,
                    EmployeeCode = upa.User.EmployeeCode,
                    DepartmentId = upa.User.DepartmentId,
                    DepartmentName = upa.User.Department != null ? upa.User.Department.Name : "",
                    AvatarUrl = upa.User.AvatarUrl,
                    IsActive = upa.User.IsActive,
                    ProjectRole = upa.Role // Include project role (keymain, member, etc.)
                })
                .ToList();
        }
        public async System.Threading.Tasks.Task GrantKeyMainPermission(long projectId, long userId, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct);
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            
            // Only admin, project creator, or team leader can grant keymain permission
            if (!IsAdmin(userSession) && project.CreatedBy != userSession.Id)
            {
                var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == project.TeamId, ct);
                if (team == null || team.LeadId != userSession.Id)
                    throw new UnauthorizedAccessException("Bạn không có quyền cấp quyền keymain cho dự án này.");
            }
            
            var assignment = await _context.UserProjectAssignments
                .FirstOrDefaultAsync(upa => upa.ProjectId == projectId && upa.UserId == userId, ct);
            
            if (assignment == null)
                throw new KeyNotFoundException("User không phải là member của project này.");
            
            assignment.Role = "keymain";
            await _context.SaveChangesAsync(ct);
        }
        public async System.Threading.Tasks.Task RevokeKeyMainPermission(long projectId, long userId, CancellationToken ct = default)
        {
            var userSession = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (userSession == null)
                throw new UnauthorizedAccessException("User chưa đăng nhập hoặc token không hợp lệ.");
            
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct);
            if (project == null)
                throw new KeyNotFoundException("Không tìm thấy dự án đó.");
            
            // Only admin, project creator, or team leader can revoke keymain permission
            if (!IsAdmin(userSession) && project.CreatedBy != userSession.Id)
            {
                var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == project.TeamId, ct);
                if (team == null || team.LeadId != userSession.Id)
                    throw new UnauthorizedAccessException("Bạn không có quyền thu hồi quyền keymain cho dự án này.");
            }
            
            var assignment = await _context.UserProjectAssignments
                .FirstOrDefaultAsync(upa => upa.ProjectId == projectId && upa.UserId == userId, ct);
            
            if (assignment == null)
                throw new KeyNotFoundException("User không phải là member của project này.");
            
            assignment.Role = null; // Remove keymain role, set to null or "member"
            await _context.SaveChangesAsync(ct);
        }
    }
}