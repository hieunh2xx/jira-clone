using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
namespace ManagementProject.Repositories
{
    public class ProjectEvaluationRepository : IProjectEvaluationRepository
    {
        private readonly ProjectManagementDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ProjectEvaluationRepository(ProjectManagementDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }
        public async System.Threading.Tasks.Task<ProjectEvaluation?> GetEvaluationByProjectAndUser(long projectId, long userId, CancellationToken ct = default)
        {
            return await _context.ProjectEvaluations
                .FirstOrDefaultAsync(e => e.ProjectId == projectId && e.UserId == userId, ct);
        }
        public async System.Threading.Tasks.Task<ProjectEvaluation> CreateEvaluation(ProjectEvaluationCreateDTO dto, long userId, CancellationToken ct = default)
        {
            var evaluation = new ProjectEvaluation
            {
                ProjectId = dto.ProjectId,
                UserId = userId,
                QualityRating = dto.QualityRating,
                QualityComment = dto.QualityComment,
                CostRating = dto.CostRating,
                CostComment = dto.CostComment,
                DeliveryRating = dto.DeliveryRating,
                DeliveryComment = dto.DeliveryComment,
                GeneralComment = dto.GeneralComment,
                DeploymentTime = dto.DeploymentTime,
                EvaluatedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.ProjectEvaluations.Add(evaluation);
            await _context.SaveChangesAsync(ct);
            return evaluation;
        }
        public async System.Threading.Tasks.Task<ProjectEvaluation> UpdateEvaluation(long id, ProjectEvaluationCreateDTO dto, CancellationToken ct = default)
        {
            var evaluation = await _context.ProjectEvaluations.FindAsync(new object[] { id }, ct);
            if (evaluation == null)
                throw new KeyNotFoundException("Evaluation not found");
            evaluation.QualityRating = dto.QualityRating;
            evaluation.QualityComment = dto.QualityComment;
            evaluation.CostRating = dto.CostRating;
            evaluation.CostComment = dto.CostComment;
            evaluation.DeliveryRating = dto.DeliveryRating;
            evaluation.DeliveryComment = dto.DeliveryComment;
            evaluation.GeneralComment = dto.GeneralComment;
            evaluation.DeploymentTime = dto.DeploymentTime;
            evaluation.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
            return evaluation;
        }
        public async System.Threading.Tasks.Task<List<ProjectEvaluationDTO>> GetEvaluationsByProject(long projectId, CancellationToken ct = default)
        {
            return await _context.ProjectEvaluations
                .Where(e => e.ProjectId == projectId)
                .Include(e => e.User)
                .Select(e => new ProjectEvaluationDTO
                {
                    Id = e.Id,
                    ProjectId = e.ProjectId,
                    UserId = e.UserId,
                    UserName = e.User.Username,
                    UserFullName = e.User.FirstName + " " + e.User.LastName,
                    QualityRating = e.QualityRating,
                    QualityComment = e.QualityComment,
                    CostRating = e.CostRating,
                    CostComment = e.CostComment,
                    DeliveryRating = e.DeliveryRating,
                    DeliveryComment = e.DeliveryComment,
                    GeneralComment = e.GeneralComment,
                    DeploymentTime = e.DeploymentTime,
                    EvaluatedAt = e.EvaluatedAt
                })
                .ToListAsync(ct);
        }
        public async System.Threading.Tasks.Task<ProjectEvaluationStatusDTO> GetEvaluationStatus(long projectId, CancellationToken ct = default)
        {
            var project = await _context.Projects
                .Include(p => p.UserProjectAssignments)
                    .ThenInclude(upa => upa.User)
                .FirstOrDefaultAsync(p => p.Id == projectId, ct);
            if (project == null)
                throw new KeyNotFoundException("Project not found");

            // Get project leader (creator) - they don't need to evaluate
            var projectLeaderId = project.CreatedBy;

            // Use users already loaded from UserProjectAssignments to avoid additional query
            // Exclude project leader from evaluation requirement
            var projectUsers = project.UserProjectAssignments
                .Select(upa => upa.User)
                .Where(u => u != null && u.Id != projectLeaderId) // Exclude project leader
                .ToList();

            var evaluations = await _context.ProjectEvaluations
                .Where(e => e.ProjectId == projectId)
                .Include(e => e.User)
                .ToListAsync(ct);
            var evaluatedUserIds = evaluations.Select(e => e.UserId).ToHashSet();
            var currentUser = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);

            var members = projectUsers.Select(u =>
            {
                var evaluation = evaluations.FirstOrDefault(e => e.UserId == u.Id);
                return new ProjectEvaluationMemberDTO
                {
                    UserId = u.Id,
                    UserName = u.Username,
                    FullName = u.FirstName + " " + u.LastName,
                    HasEvaluated = evaluatedUserIds.Contains(u.Id),
                    EvaluatedAt = evaluation?.EvaluatedAt
                };
            }).ToList();
            
            // Check if current user is project leader - they don't need to evaluate
            var isCurrentUserLeader = currentUser != null && currentUser.Id == projectLeaderId;
            
            return new ProjectEvaluationStatusDTO
            {
                ProjectId = projectId,
                RequiresEvaluation = project.RequiresEvaluation ?? false,
                TotalMembers = members.Count,
                EvaluatedMembers = members.Count(m => m.HasEvaluated),
                HasEvaluated = isCurrentUserLeader || (currentUser != null && members.Any(m => m.UserId == currentUser.Id && m.HasEvaluated)),
                Members = members
            };
        }
        public async System.Threading.Tasks.Task<List<ProjectImprovement>> GetImprovementsByProject(long projectId, string? type, long? userId = null, CancellationToken ct = default)
        {
            var query = _context.ProjectImprovements.Where(i => i.ProjectId == projectId);
            if (!string.IsNullOrEmpty(type))
                query = query.Where(i => i.Type == type);
            if (userId.HasValue)
                query = query.Where(i => i.CreatedBy == userId.Value);
            return await query.OrderBy(i => i.OrderIndex).ToListAsync(ct);
        }
        public async System.Threading.Tasks.Task<ProjectImprovement> CreateImprovement(ProjectImprovementCreateDTO dto, long userId, CancellationToken ct = default)
        {
            var improvement = new ProjectImprovement
            {
                ProjectId = dto.ProjectId,
                CreatedBy = userId,
                Type = dto.Type,
                Category = dto.Category,
                Content = dto.Content,
                OrderIndex = dto.OrderIndex,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.ProjectImprovements.Add(improvement);
            await _context.SaveChangesAsync(ct);
            return improvement;
        }
        public async System.Threading.Tasks.Task<ProjectImprovement> UpdateImprovement(long id, ProjectImprovementCreateDTO dto, long userId, CancellationToken ct = default)
        {
            var improvement = await _context.ProjectImprovements
                .FirstOrDefaultAsync(i => i.Id == id && i.CreatedBy == userId, ct);
            if (improvement == null)
                throw new KeyNotFoundException("Improvement not found");
            improvement.Type = dto.Type;
            improvement.Category = dto.Category;
            improvement.Content = dto.Content;
            improvement.OrderIndex = dto.OrderIndex;
            improvement.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
            return improvement;
        }
        public async System.Threading.Tasks.Task DeleteImprovement(long id, long userId, CancellationToken ct = default)
        {
            var improvement = await _context.ProjectImprovements
                .FirstOrDefaultAsync(i => i.Id == id && i.CreatedBy == userId, ct);
            if (improvement != null)
            {
                _context.ProjectImprovements.Remove(improvement);
                await _context.SaveChangesAsync(ct);
            }
        }
        public async System.Threading.Tasks.Task<List<ProjectTrialEvaluation>> GetTrialEvaluationsByProject(long projectId,long? userId = null,CancellationToken ct = default)
        {
            IQueryable<ProjectTrialEvaluation> query =
                _context.ProjectTrialEvaluations
                    .Where(t => t.ProjectId == projectId);

            if (userId.HasValue)
            {
                query = query.Where(t => t.UserId == userId.Value);
            }

            return await query
                .Include(t => t.User)
                .OrderBy(t => t.OrderIndex)
                .ToListAsync(ct);
        }

        public async System.Threading.Tasks.Task DeleteTrialEvaluationsByProject(long projectId, long? userId = null, CancellationToken ct = default)
        {
            var query = _context.ProjectTrialEvaluations
                .Where(t => t.ProjectId == projectId);

            if (userId.HasValue)
            {
                query = query.Where(t => t.UserId == userId.Value);
            }

            var evaluations = await query.ToListAsync(ct);
            _context.ProjectTrialEvaluations.RemoveRange(evaluations);
            await _context.SaveChangesAsync(ct);
        }
        public async System.Threading.Tasks.Task<List<ProjectTrialEvaluation>> CreateTrialEvaluations(ProjectTrialEvaluationCreateDTO dto, long userId, CancellationToken ct = default)
        {
            await DeleteTrialEvaluationsByProject(dto.ProjectId, userId, ct);
            var evaluations = dto.Items.Select(item => new ProjectTrialEvaluation
            {
                ProjectId = dto.ProjectId,
                UserId = userId,
                OrderIndex = item.OrderIndex,
                ReductionItem = item.ReductionItem,
                ManHours = item.ManHours,
                BeforeImprovement = item.BeforeImprovement,
                AfterImprovement = item.AfterImprovement,
                EstimatedEfficiency = item.EstimatedEfficiency,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();
            _context.ProjectTrialEvaluations.AddRange(evaluations);
            await _context.SaveChangesAsync(ct);
            return evaluations;
        }
        public async System.Threading.Tasks.Task<List<ProjectImage>> GetImagesByProject(
            long projectId,
            long? userId = null,
            CancellationToken ct = default)
        {
            IQueryable<ProjectImage> query =
                _context.ProjectImages
                    .Where(i => i.ProjectId == projectId);

            if (userId.HasValue)
            {
                query = query.Where(i => i.UploadedBy == userId.Value);
            }

            return await query
                .Include(i => i.UploadedByNavigation)
                .OrderBy(i => i.UploadedAt)
                .ToListAsync(ct);
        }

        public async System.Threading.Tasks.Task<ProjectImage> CreateImage(ProjectImageCreateDTO dto, long userId, CancellationToken ct = default)
        {
            var image = new ProjectImage
            {
                ProjectId = dto.ProjectId,
                ImageUrl = dto.ImageUrl,
                FileName = dto.FileName,
                FileSizeKb = dto.FileSizeKb,
                Description = dto.Description,
                UploadedBy = userId,
                UploadedAt = DateTime.UtcNow
            };
            _context.ProjectImages.Add(image);
            await _context.SaveChangesAsync(ct);
            return image;
        }
        public async System.Threading.Tasks.Task DeleteImage(long id, CancellationToken ct = default)
        {
            var image = await _context.ProjectImages.FindAsync(new object[] { id }, ct);
            if (image != null)
            {
                _context.ProjectImages.Remove(image);
                await _context.SaveChangesAsync(ct);
            }
        }
        public async System.Threading.Tasks.Task<ProjectProcess?> GetProcessByProject(long projectId, long? userId = null, CancellationToken ct = default)
        {
            var query = _context.ProjectProcesses
                .Where(p => p.ProjectId == projectId);
            
            if (userId.HasValue)
            {
                query = query.Where(p => p.UserId == userId.Value);
            }
            
            return await query.FirstOrDefaultAsync(ct);
        }
        public async System.Threading.Tasks.Task<ProjectProcess> CreateOrUpdateProcess(ProjectProcessCreateDTO dto, long userId, CancellationToken ct = default)
        {
            var process = await _context.ProjectProcesses
                .FirstOrDefaultAsync(p => p.ProjectId == dto.ProjectId && p.UserId == userId, ct);
            if (process == null)
            {
                process = new ProjectProcess
                {
                    ProjectId = dto.ProjectId,
                    UserId = userId,
                    ProcessDescription = dto.ProcessDescription,
                    ProcessOverview = dto.ProcessOverview,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ProjectProcesses.Add(process);
            }
            else
            {
                process.ProcessDescription = dto.ProcessDescription;
                process.ProcessOverview = dto.ProcessOverview;
                process.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync(ct);
            return process;
        }
    }
}
