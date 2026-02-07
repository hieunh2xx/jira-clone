using DataAccess.Models;
using ManagementProject.DTO;
using System.Threading;
namespace ManagementProject.Repositories
{
    public interface IProjectEvaluationRepository
    {
        System.Threading.Tasks.Task<ProjectEvaluation?> GetEvaluationByProjectAndUser(long projectId, long userId, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectEvaluation> CreateEvaluation(ProjectEvaluationCreateDTO dto, long userId, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectEvaluation> UpdateEvaluation(long id, ProjectEvaluationCreateDTO dto, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectEvaluationDTO>> GetEvaluationsByProject(long projectId, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectEvaluationStatusDTO> GetEvaluationStatus(long projectId, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectImprovement>> GetImprovementsByProject(long projectId, string? type, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectImprovement> CreateImprovement(ProjectImprovementCreateDTO dto, long userId, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectImprovement> UpdateImprovement(long id, ProjectImprovementCreateDTO dto, long userId, CancellationToken ct = default);
        System.Threading.Tasks.Task DeleteImprovement(long id, long userId, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectTrialEvaluation>> GetTrialEvaluationsByProject(long projectId, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task DeleteTrialEvaluationsByProject(long projectId, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectTrialEvaluation>> CreateTrialEvaluations(ProjectTrialEvaluationCreateDTO dto, long userId, CancellationToken ct = default);
        System.Threading.Tasks.Task<List<ProjectImage>> GetImagesByProject(long projectId, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectImage> CreateImage(ProjectImageCreateDTO dto, long userId, CancellationToken ct = default);
        System.Threading.Tasks.Task DeleteImage(long id, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectProcess?> GetProcessByProject(long projectId, long? userId = null, CancellationToken ct = default);
        System.Threading.Tasks.Task<ProjectProcess> CreateOrUpdateProcess(ProjectProcessCreateDTO dto, long userId, CancellationToken ct = default);
    }
}
