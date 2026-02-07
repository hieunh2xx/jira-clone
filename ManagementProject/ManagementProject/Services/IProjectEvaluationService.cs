using ManagementProject.DTO;
using System.Collections.Generic;
using System.Threading;
namespace ManagementProject.Services
{
    public interface IProjectEvaluationService
    {
        System.Threading.Tasks.Task<ProjectEvaluationDTO?> GetEvaluationByProjectAndUser(long projectId, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectEvaluationDTO> CreateOrUpdateEvaluation(ProjectEvaluationCreateDTO dto, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectEvaluationDTO>> GetEvaluationsByProject(long projectId, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectEvaluationStatusDTO> GetEvaluationStatus(long projectId, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectImprovementDTO>> GetImprovementsByProject(long projectId, string? type, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectImprovementDTO> CreateImprovement(ProjectImprovementCreateDTO dto, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectImprovementDTO> UpdateImprovement(long id, ProjectImprovementCreateDTO dto, CancellationToken ct = default);
        System.Threading.Tasks.Task DeleteImprovement(long id, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectTrialEvaluationDTO>> GetTrialEvaluationsByProject(long projectId, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectTrialEvaluationDTO>> CreateOrUpdateTrialEvaluations(ProjectTrialEvaluationCreateDTO dto, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectImageDTO>> GetImagesByProject(long projectId, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectImageDTO> CreateImage(ProjectImageCreateDTO dto, Microsoft.AspNetCore.Http.IFormFile? file = null, CancellationToken ct = default);
        System.Threading.Tasks.Task DeleteImage(long id, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectProcessDTO?> GetProcessByProject(long projectId, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectProcessDTO> CreateOrUpdateProcess(ProjectProcessCreateDTO dto, CancellationToken ct = default);
    }
}
