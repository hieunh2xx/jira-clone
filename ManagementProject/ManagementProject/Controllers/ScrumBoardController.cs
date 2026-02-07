using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace ManagementProject.Controllers
{
    [ApiController]
    [Route("api/boards")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class ScrumBoardController : ControllerBase
    {
        private readonly IScrumBoardService _service;
        private readonly ProjectManagementDbContext _context;
        public ScrumBoardController(IScrumBoardService service, ProjectManagementDbContext context)
        {
            _context = context;
            _service = service;
        }
        [HttpGet("{boardId}")]
        public async Task<ActionResult<BoardDto>> GetBoard(long boardId)
        {
            var board = await _service.GetScrumBoardAsync(boardId);
            return Ok(board);
        }
        [HttpPost("{boardId}/sprints")]
        public async Task<ActionResult<SprintDto>> CreateSprint(long boardId, [FromBody] CreateSprintRequest request)
        {
            if (request.BoardId != boardId) return BadRequest();
            var sprint = await _service.CreateSprintAsync(request);
            return CreatedAtAction(nameof(GetSprint), new { sprintId = sprint.Id }, sprint);
        }
        [HttpGet("sprints/{sprintId}")]
        public async Task<ActionResult<SprintDto>> GetSprint(long sprintId)
        {
            var sprint = await _context.Sprints
                .Include(s => s.CreatedByNavigation)
                .FirstOrDefaultAsync(s => s.Id == sprintId);
            if (sprint == null) return NotFound();
            return Ok(new SprintDto
            {
                Id = sprint.Id,
                BoardId = sprint.BoardId,
                Name = sprint.Name,
                Goal = sprint.Goal,
                StartDate = sprint.StartDate,
                EndDate = sprint.EndDate,
                Status = sprint.Status,
                CompletedDate = sprint.CompletedDate,
                CreatedAt = sprint.CreatedAt,
                CreatedBy = sprint.CreatedBy,
                CreatorUsername = sprint.CreatedByNavigation?.Username
            });
        }
        [HttpPost("sprints/{sprintId}/tasks")]
        public async Task<IActionResult> AddTasksToSprint(long sprintId, [FromBody] AddTasksToSprintRequest request)
        {
            if (request.SprintId != sprintId) return BadRequest();
            await _service.AddTasksToSprintAsync(request);
            return NoContent();
        }
        [HttpPatch("tasks/position")]
        public async Task<IActionResult> UpdateTaskPosition([FromBody] UpdateTaskPositionRequest request)
        {
            await _service.UpdateTaskPositionAsync(request);
            return NoContent();
        }
        [HttpPost("columns/{columnId}/reorder")]
        public async Task<ActionResult<List<TaskBoardPositionDto>>> ReorderColumn(
            long columnId, long boardId, [FromBody] List<long> taskIds)
        {
            var result = await _service.ReorderTasksInColumn(boardId, columnId, taskIds);
            return Ok(result);
        }
        [HttpGet("{boardId}/tasks")]
        public async Task<IActionResult> GetBoardTasks(long boardId)
        {
            var tasks = await _context.VwScrumBoardTasks
                .Where(t => t.BoardId == boardId)
                .ToListAsync();
            return Ok(tasks);
        }
    }
}