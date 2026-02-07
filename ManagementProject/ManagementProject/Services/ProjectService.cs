using ManagementProject.DTO;
using ManagementProject.Repositories;
using ManagementProject.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
namespace ManagementProject.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _repository;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<ProjectService> _logger;
        public ProjectService(IProjectRepository repository, INotificationService notificationService, IEmailService emailService, IHttpContextAccessor httpContextAccessor, ILogger<ProjectService> logger)
        {
            _repository = repository;
            _notificationService = notificationService;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }
        public Task<List<ProjectDTO>> GetAllProject(string? keyword, CancellationToken ct = default)
        {
            return _repository.GetAllProject(keyword, ct);
        }
        public Task<PagedResultDto<ProjectDTO>> GetAllProjectPaged(string? keyword, int page = 1, int pageSize = 10, CancellationToken ct = default)
        {
            return _repository.GetAllProjectPaged(keyword, page, pageSize, ct);
        }
        public Task<ProjectDTO?> GetProjectDetail(long id, CancellationToken ct = default)
        {
            return _repository.GetProjectDetail(id, ct);
        }
        public Task<List<ProjectDTO>> GetProjectByUser(CancellationToken ct = default)
        {
            return _repository.GetProjectByUser(ct);
        }
        public async Task AddProject(ProjectCreateDTO dto, CancellationToken ct = default)
        {
            await _repository.AddProject(dto, ct);
            // Get the created project to send emails to members
            // Find project by code and name (most reliable way after creation)
            var projects = await _repository.GetAllProject(null, ct);
            var createdProject = projects
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault(p => p.Code == dto.Code && p.Name == dto.Name && p.TeamId == dto.TeamId);
            if (createdProject != null)
            {
                // Get project members that were added
                var members = await _repository.GetProjectMembers(createdProject.Id, ct);
                var memberIds = members.Select(m => m.Id).ToList();
                if (memberIds.Any())
                {
                    try
                    {
                        await _emailService.SendProjectCreatedEmailAsync(createdProject.Id, memberIds);
                    }
                    catch (Exception ex)
                    {
                        // Log error but don't fail the project creation
                        _logger.LogError(ex, "Failed to send project created email for project {ProjectId}", createdProject.Id);
                    }
                }
            }
        }
        public async Task UpdateProject(int id, ProjectUpdateDTO dto, CancellationToken ct = default)
        {
            // Get project info before update to avoid concurrency issues
            var projectBeforeUpdate = await _repository.GetProjectDetail(id, ct);
            var userId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
            var projectName = projectBeforeUpdate?.Name ?? dto.Name;
            
            // Perform the update - ensure it completes fully
            await _repository.UpdateProject(id, dto, ct);
            
            // Send notification using project name from before update to avoid another DB query
            if (projectBeforeUpdate != null)
            {
                try
                {
                    await _notificationService.NotifyProjectChangeAsync(
                        id,
                        "project_updated",
                        $"Dự án đã được cập nhật: {projectName}",
                        $"Dự án \"{projectName}\" đã được cập nhật thông tin.",
                        userId,
                        ct);
                }
                catch (Exception ex)
                {
                    // Log but don't fail the update if notification fails
                    _logger.LogError(ex, "Failed to send notification for project update {ProjectId}", id);
                }
            }
        }
        public Task DeleteProject(int id, CancellationToken ct = default)
        {
            return _repository.DeleteProject(id, ct);
        }
        public async Task CompleteProject(long id, CancellationToken ct = default)
        {
            // Get project info before completing to avoid concurrency issues
            var projectBeforeComplete = await _repository.GetProjectDetail(id, ct);
            var userId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
            var projectName = projectBeforeComplete?.Name ?? "Dự án";
            
            await _repository.CompleteProject(id, ct);
            
            if (projectBeforeComplete != null)
            {
                try
                {
                    await _notificationService.NotifyProjectChangeAsync(
                        id,
                        "project_completed",
                        $"Dự án đã hoàn thành: {projectName}",
                        $"Dự án \"{projectName}\" đã được đánh dấu hoàn thành. Tất cả thành viên cần đánh giá trước khi xem thông tin dự án.",
                        userId,
                        ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send notification for project completion {ProjectId}", id);
                }
            }
        }
        public async Task ReopenProject(long id, CancellationToken ct = default)
        {
            // Get project info before reopening to avoid concurrency issues
            var projectBeforeReopen = await _repository.GetProjectDetail(id, ct);
            var userId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
            var projectName = projectBeforeReopen?.Name ?? "Dự án";
            
            await _repository.ReopenProject(id, ct);
            
            if (projectBeforeReopen != null)
            {
                try
                {
                    await _notificationService.NotifyProjectChangeAsync(
                        id,
                        "project_reopened",
                        $"Dự án đã được mở lại: {projectName}",
                        $"Dự án \"{projectName}\" đã được mở lại. Dự án có thể tiếp tục được chỉnh sửa.",
                        userId,
                        ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send notification for project reopen {ProjectId}", id);
                }
            }
        }
        public async Task AddProjectMember(long projectId, long userId, CancellationToken ct = default)
        {
            await _repository.AddProjectMember(projectId, userId, ct);
            var project = await _repository.GetProjectDetail(projectId, ct);
            if (project != null)
            {
                await _notificationService.CreateNotificationAsync(new NotificationCreateDto
                {
                    UserId = userId,
                    Type = "project_member_added",
                    Title = $"Bạn đã được thêm vào dự án: {project.Name}",
                    Message = $"Bạn đã được thêm vào dự án \"{project.Name}\".",
                    ProjectId = projectId
                }, ct);
                
                // Send email notification
                var addedByUserId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
                if (addedByUserId.HasValue)
                {
                    try
                    {
                        await _emailService.SendProjectMemberAddedEmailAsync(projectId, userId, addedByUserId.Value);
                    }
                    catch (Exception ex)
                    {
                        // Log error but don't fail the member addition
                        _logger.LogError(ex, "Failed to send project member added email for project {ProjectId}, user {UserId}", projectId, userId);
                    }
                }
            }
        }
        public async Task RemoveProjectMember(long projectId, long userId, CancellationToken ct = default)
        {
            var project = await _repository.GetProjectDetail(projectId, ct);
            await _repository.RemoveProjectMember(projectId, userId, ct);
            if (project != null)
            {
                await _notificationService.CreateNotificationAsync(new NotificationCreateDto
                {
                    UserId = userId,
                    Type = "project_member_removed",
                    Title = $"Bạn đã bị xóa khỏi dự án: {project.Name}",
                    Message = $"Bạn đã bị xóa khỏi dự án \"{project.Name}\".",
                    ProjectId = projectId
                }, ct);
            }
        }
        public Task<List<UserDto>> GetProjectMembers(long projectId, CancellationToken ct = default)
        {
            return _repository.GetProjectMembers(projectId, ct);
        }
        public Task GrantKeyMainPermission(long projectId, long userId, CancellationToken ct = default)
        {
            return _repository.GrantKeyMainPermission(projectId, userId, ct);
        }
        public Task RevokeKeyMainPermission(long projectId, long userId, CancellationToken ct = default)
        {
            return _repository.RevokeKeyMainPermission(projectId, userId, ct);
        }
    }
}