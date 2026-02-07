using ManagementProject.DTO;
using ManagementProject.Repositories;
using ManagementProject.Utils;
using Microsoft.AspNetCore.Http;
namespace ManagementProject.Services
{
    public class TeamService : ITeamService
    {
        private readonly ITeamRepository _repository;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public TeamService(ITeamRepository repository, IEmailService emailService, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
        }
        public Task<List<TeamDTO>> GetAllTeams(string? keyword, CancellationToken ct = default)
        {
            return _repository.GetAllTeams(keyword, ct);
        }
        public Task<TeamDTO?> GetTeamDetail(long id, CancellationToken ct = default)
        {
            return _repository.GetTeamDetail(id, ct);
        }
        public Task AddTeam(TeamCreateDTO dto, CancellationToken ct = default)
        {
            return _repository.AddTeam(dto, ct);
        }
        public Task UpdateTeam(long id, TeamUpdateDTO dto, CancellationToken ct = default)
        {
            return _repository.UpdateTeam(id, dto, ct);
        }
        public Task DeleteTeam(long id, CancellationToken ct = default)
        {
            return _repository.DeleteTeam(id, ct);
        }
        public async Task AddTeamMember(long teamId, long userId, CancellationToken ct = default)
        {
            await _repository.AddTeamMember(teamId, userId, ct);
            var addedByUserId = JwtUserUtils.GetUserIdFromClaims(_httpContextAccessor);
            if (addedByUserId.HasValue)
            {
                await _emailService.SendTeamMemberAddedEmailAsync(teamId, userId, addedByUserId.Value);
            }
        }
        public Task RemoveTeamMember(long teamId, long userId, CancellationToken ct = default)
        {
            return _repository.RemoveTeamMember(teamId, userId, ct);
        }
    }
}