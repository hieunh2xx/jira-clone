using ManagementProject.DTO;
namespace ManagementProject.Services
{
    public interface ITeamService
    {
        Task<List<TeamDTO>> GetAllTeams(string? keyword, CancellationToken ct = default);
        Task<TeamDTO?> GetTeamDetail(long id, CancellationToken ct = default);
        Task AddTeam(TeamCreateDTO dto, CancellationToken ct = default);
        Task UpdateTeam(long id, TeamUpdateDTO dto, CancellationToken ct = default);
        Task DeleteTeam(long id, CancellationToken ct = default);
        Task AddTeamMember(long teamId, long userId, CancellationToken ct = default);
        Task RemoveTeamMember(long teamId, long userId, CancellationToken ct = default);
    }
}