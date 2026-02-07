using AutoMapper;
using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Repositories;
using ManagementProject.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
namespace ManagementProject.Services
{
    public class ScrumBoardService : IScrumBoardService
    {
        private readonly IScrumBoardRepository _repo;
        private readonly IMapper _mapper;
        private readonly ProjectManagementDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ScrumBoardService(IScrumBoardRepository repo, IMapper mapper, ProjectManagementDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _repo = repo;
            _mapper = mapper;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }
        private bool IsSystemAdmin(UserDto user)
        {
            return user.RoleName.Any(r => 
                string.Equals(r?.Trim().ToLowerInvariant(), "system_admin", StringComparison.OrdinalIgnoreCase));
        }
        public async Task<BoardDto> GetScrumBoardAsync(long boardId)
        {
            var board = await _repo.GetBoardWithColumnsAsync(boardId);
            return new BoardDto
            {
                Id = board.Id,
                Name = board.Name,
                ProjectId = board.ProjectId,
                Columns = board.BoardColumns.Select(c => new BoardColumnDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Position = c.Position,
                    WipLimit = c.WipLimit,
                    WorkflowStatusId = c.WorkflowStatusId,
                    IsHidden = c.IsHidden.HasValue ? true : false,
                }).OrderBy(c => c.Position).ToList()
            };
        }
        public async Task<SprintDto> CreateSprintAsync(CreateSprintRequest request)
        {
            var sprint = new Sprint
            {
                BoardId = request.BoardId,
                Name = request.Name,
                Goal = request.Goal,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = "planning",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = request.CreatedBy
            };
            var created = await _repo.CreateSprintAsync(sprint);
            return _mapper.Map<SprintDto>(created);
        }
        public async System.Threading.Tasks.Task AddTasksToSprintAsync(AddTasksToSprintRequest request)
        {
            var sprint = await _context.Sprints.FindAsync(request.SprintId);
            if (sprint == null || sprint.Status == "closed") throw new BadHttpRequestException("Invalid sprint");
            await _repo.AddTasksToSprintAsync(request.SprintId, request.TaskIds);
        }
        public async System.Threading.Tasks.Task UpdateTaskPositionAsync(UpdateTaskPositionRequest request)
        {
            var tasksInTargetColumn = await _repo.GetTasksInColumnAsync(request.BoardId, request.TargetColumnId ?? 0);
            var newPosition = request.NewPosition;
            var existing = tasksInTargetColumn.FirstOrDefault(t => t.TaskId == request.TaskId);
            if (existing != null)
            {
                tasksInTargetColumn.Remove(existing);
            }
            foreach (var t in tasksInTargetColumn.Where(t => t.Position >= newPosition))
            {
                t.Position += 1;
            }
            await _repo.UpdateTaskPositionAsync(request.TaskId, request.BoardId, request.TargetColumnId, newPosition);
        }
        public async Task<List<TaskBoardPositionDto>> ReorderTasksInColumn(long boardId, long columnId, List<long> taskIds)
        {
            var positions = new List<TaskBoardPositionDto>();
            double pos = 0;
            foreach (var taskId in taskIds)
            {
                await _repo.UpdateTaskPositionAsync(taskId, boardId, columnId, pos);
                positions.Add(new TaskBoardPositionDto
                {
                    TaskId = taskId,
                    BoardId = boardId,
                    ColumnId = columnId,
                    Position = pos
                });
                pos += 1;
            }
            return positions;
        }
    }
}