using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
namespace ManagementProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectEvaluationController : ControllerBase
    {
        private readonly IProjectEvaluationService _service;
        public ProjectEvaluationController(IProjectEvaluationService service)
        {
            _service = service;
        }
        [HttpGet("project/{projectId:long}")]
        public async Task<ActionResult> GetEvaluationByProject(long projectId, CancellationToken ct)
        {
            var evaluation = await _service.GetEvaluationByProjectAndUser(projectId, ct);
            if (evaluation == null)
                return Ok(new { code = 200, message = "Chưa có đánh giá", data = (object?)null });
            return Ok(new { code = 200, message = "Thành công", data = evaluation });
        }
        [HttpPost("evaluation")]
        public async Task<ActionResult> CreateOrUpdateEvaluation([FromBody] ProjectEvaluationCreateDTO dto, CancellationToken ct)
        {
            var evaluation = await _service.CreateOrUpdateEvaluation(dto, ct);
            return Ok(new { code = 200, message = "Lưu đánh giá thành công", data = evaluation });
        }
        [HttpGet("project/{projectId:long}/all")]
        public async Task<ActionResult> GetEvaluationsByProject(long projectId, CancellationToken ct)
        {
            var evaluations = await _service.GetEvaluationsByProject(projectId, ct);
            return Ok(new { code = 200, message = "Thành công", data = evaluations });
        }
        [HttpGet("project/{projectId:long}/status")]
        public async Task<ActionResult> GetEvaluationStatus(long projectId, CancellationToken ct)
        {
            var status = await _service.GetEvaluationStatus(projectId, ct);
            return Ok(new { code = 200, message = "Thành công", data = status });
        }
        [HttpGet("project/{projectId:long}/improvements")]
        public async Task<ActionResult> GetImprovements(long projectId, [FromQuery] string? type, [FromQuery] long? userId, CancellationToken ct)
        {
            var improvements = await _service.GetImprovementsByProject(projectId, type, userId, ct);
            return Ok(new { code = 200, message = "Thành công", data = improvements });
        }
        [HttpPost("improvements")]
        public async Task<ActionResult> CreateImprovement([FromBody] ProjectImprovementCreateDTO dto, CancellationToken ct)
        {
            var improvement = await _service.CreateImprovement(dto, ct);
            return Ok(new { code = 200, message = "Tạo cải tiến thành công", data = improvement });
        }
        [HttpPut("improvements/{id:long}")]
        public async Task<ActionResult> UpdateImprovement(long id, [FromBody] ProjectImprovementCreateDTO dto, CancellationToken ct)
        {
            var improvement = await _service.UpdateImprovement(id, dto, ct);
            return Ok(new { code = 200, message = "Cập nhật cải tiến thành công", data = improvement });
        }
        [HttpDelete("improvements/{id:long}")]
        public async Task<ActionResult> DeleteImprovement(long id, CancellationToken ct)
        {
            await _service.DeleteImprovement(id, ct);
            return Ok(new { code = 200, message = "Xóa cải tiến thành công", data = (object?)null });
        }
        [HttpGet("project/{projectId:long}/trial-evaluations")]
        public async Task<ActionResult> GetTrialEvaluations(long projectId, [FromQuery] long? userId, CancellationToken ct)
        {
            var evaluations = await _service.GetTrialEvaluationsByProject(projectId, userId, ct);
            return Ok(new { code = 200, message = "Thành công", data = evaluations });
        }
        [HttpPost("trial-evaluations")]
        public async Task<ActionResult> CreateOrUpdateTrialEvaluations([FromBody] ProjectTrialEvaluationCreateDTO dto, CancellationToken ct)
        {
            var evaluations = await _service.CreateOrUpdateTrialEvaluations(dto, ct);
            return Ok(new { code = 200, message = "Lưu đánh giá thử nghiệm thành công", data = evaluations });
        }
        [HttpGet("project/{projectId:long}/images")]
        public async Task<ActionResult> GetImages(long projectId, [FromQuery] long? userId, CancellationToken ct)
        {
            var images = await _service.GetImagesByProject(projectId, userId, ct);
            return Ok(new { code = 200, message = "Thành công", data = images });
        }
        [HttpPost("images")]
        [RequestSizeLimit(104857600)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult> CreateImage(
            [FromForm] ProjectImageUploadDTO uploadDto,
            CancellationToken ct)
        {
            if (uploadDto.Image == null || uploadDto.Image.Length == 0)
                return BadRequest(new { code = 400, message = "Vui lòng chọn file hình ảnh", data = (object?)null });
            
            var imageDto = new ProjectImageCreateDTO
            {
                ProjectId = uploadDto.ProjectId,
                ImageUrl = "", // Will be set by service after upload
                FileName = uploadDto.Image.FileName,
                FileSizeKb = (long)(uploadDto.Image.Length / 1024),
                Description = uploadDto.Description
            };
            var result = await _service.CreateImage(imageDto, uploadDto.Image, ct);
            return Ok(new { code = 200, message = "Thêm hình ảnh thành công", data = result });
        }
        [HttpDelete("images/{id:long}")]
        public async Task<ActionResult> DeleteImage(long id, CancellationToken ct)
        {
            await _service.DeleteImage(id, ct);
            return Ok(new { code = 200, message = "Xóa hình ảnh thành công", data = (object?)null });
        }
        [HttpGet("project/{projectId:long}/process")]
        public async Task<ActionResult> GetProcess(long projectId, [FromQuery] long? userId, CancellationToken ct)
        {
            var process = await _service.GetProcessByProject(projectId, userId, ct);
            if (process == null)
                return Ok(new { code = 200, message = "Chưa có thông tin quá trình", data = (object?)null });
            return Ok(new { code = 200, message = "Thành công", data = process });
        }
        [HttpPost("process")]
        public async Task<ActionResult> CreateOrUpdateProcess([FromBody] ProjectProcessCreateDTO dto, CancellationToken ct)
        {
            var process = await _service.CreateOrUpdateProcess(dto, ct);
            return Ok(new { code = 200, message = "Lưu quá trình thành công", data = process });
        }
    }
}
