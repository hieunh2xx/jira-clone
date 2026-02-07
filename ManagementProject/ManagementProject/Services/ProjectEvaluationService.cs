using AutoMapper;
using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Repositories;
using ManagementProject.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Linq;
namespace ManagementProject.Services
{
    public class ProjectEvaluationService : IProjectEvaluationService
    {
        private readonly IProjectEvaluationRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly DataAccess.Models.ProjectManagementDbContext _context;
        private readonly IMapper _mapper;
        private readonly CloudinaryService _cloudinaryService;
        private readonly INotificationService _notificationService;
        public ProjectEvaluationService(
            IProjectEvaluationRepository repository,
            IHttpContextAccessor httpContextAccessor,
            DataAccess.Models.ProjectManagementDbContext context,
            IMapper mapper,
            CloudinaryService cloudinaryService,
            INotificationService notificationService)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _context = context;
            _mapper = mapper;
            _cloudinaryService = cloudinaryService;
            _notificationService = notificationService;
        }
        public async System.Threading.Tasks.Task<ProjectEvaluationDTO?> GetEvaluationByProjectAndUser(long projectId, CancellationToken ct = default)
        {
            var user = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (user == null)
                throw new UnauthorizedAccessException("User not authenticated");
            var evaluation = await _repository.GetEvaluationByProjectAndUser(projectId, user.Id, ct);
            if (evaluation == null)
                return null;
            return new ProjectEvaluationDTO
            {
                Id = evaluation.Id,
                ProjectId = evaluation.ProjectId,
                UserId = evaluation.UserId,
                UserName = user.Username,
                UserFullName = user.FullName,
                QualityRating = evaluation.QualityRating,
                QualityComment = evaluation.QualityComment,
                CostRating = evaluation.CostRating,
                CostComment = evaluation.CostComment,
                DeliveryRating = evaluation.DeliveryRating,
                DeliveryComment = evaluation.DeliveryComment,
                GeneralComment = evaluation.GeneralComment,
                EvaluatedAt = evaluation.EvaluatedAt
            };
        }
        public async System.Threading.Tasks.Task<ProjectEvaluationDTO> CreateOrUpdateEvaluation(ProjectEvaluationCreateDTO dto, CancellationToken ct = default)
        {
            var user = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (user == null)
                throw new UnauthorizedAccessException("User not authenticated");
            var existing = await _repository.GetEvaluationByProjectAndUser(dto.ProjectId, user.Id, ct);
            ProjectEvaluation evaluation;
            if (existing != null)
            {
                evaluation = await _repository.UpdateEvaluation(existing.Id, dto, ct);
            }
            else
            {
                evaluation = await _repository.CreateEvaluation(dto, user.Id, ct);
            }
            try
            {
                await _notificationService.NotifyProjectEvaluationAsync(evaluation.ProjectId, evaluation.Id, user.Id, ct);
            }
            catch
            {
            }
            return new ProjectEvaluationDTO
            {
                Id = evaluation.Id,
                ProjectId = evaluation.ProjectId,
                UserId = evaluation.UserId,
                UserName = user.Username,
                UserFullName = user.FullName,
                QualityRating = evaluation.QualityRating,
                QualityComment = evaluation.QualityComment,
                CostRating = evaluation.CostRating,
                CostComment = evaluation.CostComment,
                DeliveryRating = evaluation.DeliveryRating,
                DeliveryComment = evaluation.DeliveryComment,
                GeneralComment = evaluation.GeneralComment,
                EvaluatedAt = evaluation.EvaluatedAt
            };
        }
        public async System.Threading.Tasks.Task<List<ProjectEvaluationDTO>> GetEvaluationsByProject(long projectId, CancellationToken ct = default)
        {
            return await _repository.GetEvaluationsByProject(projectId, ct);
        }
        public async System.Threading.Tasks.Task<ProjectEvaluationStatusDTO> GetEvaluationStatus(long projectId, CancellationToken ct = default)
        {
            return await _repository.GetEvaluationStatus(projectId, ct);
        }
        public async System.Threading.Tasks.Task<List<ProjectImprovementDTO>> GetImprovementsByProject(long projectId, string? type, long? userId = null, CancellationToken ct = default)
        {
            var improvements = await _repository.GetImprovementsByProject(projectId, type, userId, ct);
            return improvements.Select(i => new ProjectImprovementDTO
            {
                Id = i.Id,
                ProjectId = i.ProjectId,
                Type = i.Type,
                Category = i.Category,
                Content = i.Content,
                OrderIndex = i.OrderIndex
            }).ToList();
        }
        public async System.Threading.Tasks.Task<ProjectImprovementDTO> CreateImprovement(ProjectImprovementCreateDTO dto, CancellationToken ct = default)
        {
            var user = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (user == null)
                throw new UnauthorizedAccessException("User not authenticated");
            
            var improvement = await _repository.CreateImprovement(dto, user.Id, ct);
            return new ProjectImprovementDTO
            {
                Id = improvement.Id,
                ProjectId = improvement.ProjectId,
                Type = improvement.Type,
                Category = improvement.Category,
                Content = improvement.Content,
                OrderIndex = improvement.OrderIndex
            };
        }
        public async System.Threading.Tasks.Task<ProjectImprovementDTO> UpdateImprovement(long id, ProjectImprovementCreateDTO dto, CancellationToken ct = default)
        {
            var user = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (user == null)
                throw new UnauthorizedAccessException("User not authenticated");
            
            var improvement = await _repository.UpdateImprovement(id, dto, user.Id, ct);
            return new ProjectImprovementDTO
            {
                Id = improvement.Id,
                ProjectId = improvement.ProjectId,
                Type = improvement.Type,
                Category = improvement.Category,
                Content = improvement.Content,
                OrderIndex = improvement.OrderIndex
            };
        }
        public async System.Threading.Tasks.Task DeleteImprovement(long id, CancellationToken ct = default)
        {
            var user = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (user == null)
                throw new UnauthorizedAccessException("User not authenticated");
            
            await _repository.DeleteImprovement(id, user.Id, ct);
        }
        public async System.Threading.Tasks.Task<List<ProjectTrialEvaluationDTO>> GetTrialEvaluationsByProject(long projectId, long? userId = null, CancellationToken ct = default)
        {
            var evaluations = await _repository.GetTrialEvaluationsByProject(projectId, userId, ct);
            return evaluations.Select(e => new ProjectTrialEvaluationDTO
            {
                Id = e.Id,
                ProjectId = e.ProjectId,
                UserId = e.UserId,
                UserName = e.User?.Username,
                UserFullName = e.User != null ? e.User.FirstName + " " + e.User.LastName : null,
                OrderIndex = e.OrderIndex,
                ReductionItem = e.ReductionItem,
                ManHours = e.ManHours,
                BeforeImprovement = e.BeforeImprovement,
                AfterImprovement = e.AfterImprovement,
                EstimatedEfficiency = e.EstimatedEfficiency
            }).ToList();
        }
        public async System.Threading.Tasks.Task<List<ProjectTrialEvaluationDTO>> CreateOrUpdateTrialEvaluations(ProjectTrialEvaluationCreateDTO dto, CancellationToken ct = default)
        {
            var user = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (user == null)
                throw new UnauthorizedAccessException("User not authenticated");
            
            var evaluations = await _repository.CreateTrialEvaluations(dto, user.Id, ct);
            return evaluations.Select(e => new ProjectTrialEvaluationDTO
            {
                Id = e.Id,
                ProjectId = e.ProjectId,
                UserId = e.UserId,
                UserName = user.Username,
                UserFullName = user.FullName,
                OrderIndex = e.OrderIndex,
                ReductionItem = e.ReductionItem,
                ManHours = e.ManHours,
                BeforeImprovement = e.BeforeImprovement,
                AfterImprovement = e.AfterImprovement,
                EstimatedEfficiency = e.EstimatedEfficiency
            }).ToList();
        }
        public async System.Threading.Tasks.Task<List<ProjectImageDTO>> GetImagesByProject(long projectId, long? userId = null, CancellationToken ct = default)
        {
            var images = await _repository.GetImagesByProject(projectId, userId, ct);
            
            // Use navigation property to get user name, avoiding Contains query
            return images.Select(i => new ProjectImageDTO
            {
                Id = i.Id,
                ProjectId = i.ProjectId,
                ImageUrl = i.ImageUrl,
                FileName = i.FileName,
                FileSizeKb = i.FileSizeKb,
                Description = i.Description,
                UploadedBy = i.UploadedBy,
                UploadedByName = i.UploadedByNavigation != null 
                    ? i.UploadedByNavigation.FirstName + " " + i.UploadedByNavigation.LastName 
                    : null,
                UploadedAt = i.UploadedAt
            }).ToList();
        }
        public async System.Threading.Tasks.Task<ProjectImageDTO> CreateImage(ProjectImageCreateDTO dto, Microsoft.AspNetCore.Http.IFormFile? file, CancellationToken ct = default)
        {
            var user = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (user == null)
                throw new UnauthorizedAccessException("User not authenticated");
            
            // If file is provided, upload to Cloudinary
            if (file != null && file.Length > 0)
            {
                using var stream = file.OpenReadStream();
                var uploadResult = _cloudinaryService.UploadImage(stream, file.FileName);
                if (uploadResult == null || uploadResult.SecureUrl == null)
                {
                    throw new InvalidOperationException($"Không thể upload ảnh {file.FileName}");
                }
                dto.ImageUrl = uploadResult.SecureUrl.ToString();
                dto.FileName = file.FileName;
                dto.FileSizeKb = (long)(file.Length / 1024);
            }
            
            var image = await _repository.CreateImage(dto, user.Id, ct);
            return new ProjectImageDTO
            {
                Id = image.Id,
                ProjectId = image.ProjectId,
                ImageUrl = image.ImageUrl,
                FileName = image.FileName,
                FileSizeKb = image.FileSizeKb,
                Description = image.Description,
                UploadedBy = image.UploadedBy,
                UploadedByName = user.FullName,
                UploadedAt = image.UploadedAt
            };
        }
        public async System.Threading.Tasks.Task DeleteImage(long id, CancellationToken ct = default)
        {
            await _repository.DeleteImage(id, ct);
        }
        public async System.Threading.Tasks.Task<ProjectProcessDTO?> GetProcessByProject(long projectId, long? userId = null, CancellationToken ct = default)
        {
            var process = await _repository.GetProcessByProject(projectId, userId, ct);
            if (process == null)
                return null;
            return new ProjectProcessDTO
            {
                Id = process.Id,
                ProjectId = process.ProjectId,
                ProcessDescription = process.ProcessDescription,
                ProcessOverview = process.ProcessOverview
            };
        }
        public async System.Threading.Tasks.Task<ProjectProcessDTO> CreateOrUpdateProcess(ProjectProcessCreateDTO dto, CancellationToken ct = default)
        {
            var user = await JwtUserUtils.GetUserFromClaimsWithDbAsync(_httpContextAccessor, _context, ct);
            if (user == null)
                throw new UnauthorizedAccessException("User not authenticated");
            
            var process = await _repository.CreateOrUpdateProcess(dto, user.Id, ct);
            return new ProjectProcessDTO
            {
                Id = process.Id,
                ProjectId = process.ProjectId,
                ProcessDescription = process.ProcessDescription,
                ProcessOverview = process.ProcessOverview
            };
        }
    }
}
