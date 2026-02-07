using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace ManagementProject.Controllers
{
    [ApiController]
    [Route("api/powerbi")]
    [Authorize]
    public class PowerBIController : ControllerBase
    {
        private readonly IPowerBIExportService _exportService;

        public PowerBIController(IPowerBIExportService exportService)
        {
            _exportService = exportService;
        }

        /// <summary>
        /// Lấy dữ liệu Tasks dạng JSON cho Power BI
        /// </summary>
        [HttpGet("tasks")]
        public async Task<ActionResult> GetTasks(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? statuses,
            [FromQuery] string? priorities,
            [FromQuery] bool? includeCompleted,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate,
                Statuses = !string.IsNullOrEmpty(statuses) ? statuses.Split(',').ToList() : null,
                Priorities = !string.IsNullOrEmpty(priorities) ? priorities.Split(',').ToList() : null,
                IncludeCompleted = includeCompleted ?? true
            };

            var data = await _exportService.GetTasksForExportAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Projects dạng JSON cho Power BI
        /// </summary>
        [HttpGet("projects")]
        public async Task<ActionResult> GetProjects(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetProjectsForExportAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu User Performance dạng JSON cho Power BI
        /// </summary>
        [HttpGet("user-performance")]
        public async Task<ActionResult> GetUserPerformance(
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? projectId,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                UserId = userId,
                DepartmentId = departmentId,
                ProjectId = projectId
            };

            var data = await _exportService.GetUserPerformanceForExportAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Time Tracking dạng JSON cho Power BI
        /// </summary>
        [HttpGet("time-tracking")]
        public async Task<ActionResult> GetTimeTracking(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetTimeTrackingForExportAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Export Tasks sang CSV file
        /// </summary>
        [HttpGet("tasks/export/csv")]
        public async Task<IActionResult> ExportTasksToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? statuses,
            [FromQuery] string? priorities,
            [FromQuery] bool? includeCompleted,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate,
                Statuses = !string.IsNullOrEmpty(statuses) ? statuses.Split(',').ToList() : null,
                Priorities = !string.IsNullOrEmpty(priorities) ? priorities.Split(',').ToList() : null,
                IncludeCompleted = includeCompleted ?? true
            };

            var csvBytes = await _exportService.ExportTasksToCsvAsync(filter, ct);
            var fileName = $"Tasks_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Projects sang CSV file
        /// </summary>
        [HttpGet("projects/export/csv")]
        public async Task<IActionResult> ExportProjectsToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportProjectsToCsvAsync(filter, ct);
            var fileName = $"Projects_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export User Performance sang CSV file
        /// </summary>
        [HttpGet("user-performance/export/csv")]
        public async Task<IActionResult> ExportUserPerformanceToCsv(
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? projectId,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                UserId = userId,
                DepartmentId = departmentId,
                ProjectId = projectId
            };

            var csvBytes = await _exportService.ExportUserPerformanceToCsvAsync(filter, ct);
            var fileName = $"UserPerformance_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Time Tracking sang CSV file
        /// </summary>
        [HttpGet("time-tracking/export/csv")]
        public async Task<IActionResult> ExportTimeTrackingToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportTimeTrackingToCsvAsync(filter, ct);
            var fileName = $"TimeTracking_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Upload Tasks CSV lên Cloudinary và trả về URL để download
        /// </summary>
        [HttpPost("tasks/upload")]
        public async Task<ActionResult> UploadTasksToAzure(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? statuses,
            [FromQuery] string? priorities,
            [FromQuery] bool? includeCompleted,
            CancellationToken ct = default)
        {
            try
            {
                var filter = new PowerBIExportFilterDto
                {
                    ProjectId = projectId,
                    UserId = userId,
                    DepartmentId = departmentId,
                    TeamId = teamId,
                    StartDate = startDate,
                    EndDate = endDate,
                    Statuses = !string.IsNullOrEmpty(statuses) ? statuses.Split(',').ToList() : null,
                    Priorities = !string.IsNullOrEmpty(priorities) ? priorities.Split(',').ToList() : null,
                    IncludeCompleted = includeCompleted ?? true
                };

                var url = await _exportService.UploadTasksToAzureAsync(filter, ct);
                return Ok(new { code = 200, message = "Upload lên Cloudinary thành công", data = new { url, downloadUrl = url } });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi upload: {ex.Message}", data = (object?)null });
            }
        }

        /// <summary>
        /// Upload Projects CSV lên Cloudinary và trả về URL để download
        /// </summary>
        [HttpPost("projects/upload")]
        public async Task<ActionResult> UploadProjectsToAzure(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            try
            {
                var filter = new PowerBIExportFilterDto
                {
                    ProjectId = projectId,
                    DepartmentId = departmentId,
                    TeamId = teamId,
                    StartDate = startDate,
                    EndDate = endDate
                };

                var url = await _exportService.UploadProjectsToAzureAsync(filter, ct);
                return Ok(new { code = 200, message = "Upload lên Cloudinary thành công", data = new { url, downloadUrl = url } });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi upload: {ex.Message}", data = (object?)null });
            }
        }

        /// <summary>
        /// Upload User Performance CSV lên Cloudinary và trả về URL để download
        /// </summary>
        [HttpPost("user-performance/upload")]
        public async Task<ActionResult> UploadUserPerformanceToAzure(
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? projectId,
            CancellationToken ct = default)
        {
            try
            {
                var filter = new PowerBIExportFilterDto
                {
                    UserId = userId,
                    DepartmentId = departmentId,
                    ProjectId = projectId
                };

                var url = await _exportService.UploadUserPerformanceToAzureAsync(filter, ct);
                return Ok(new { code = 200, message = "Upload lên Cloudinary thành công", data = new { url, downloadUrl = url } });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi upload: {ex.Message}", data = (object?)null });
            }
        }

        /// <summary>
        /// Upload Time Tracking CSV lên Cloudinary và trả về URL để download
        /// </summary>
        [HttpPost("time-tracking/upload")]
        public async Task<ActionResult> UploadTimeTrackingToAzure(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            try
            {
                var filter = new PowerBIExportFilterDto
                {
                    ProjectId = projectId,
                    UserId = userId,
                    StartDate = startDate,
                    EndDate = endDate
                };

                var url = await _exportService.UploadTimeTrackingToAzureAsync(filter, ct);
                return Ok(new { code = 200, message = "Upload lên Cloudinary thành công", data = new { url, downloadUrl = url } });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = 400, message = ex.Message, data = (object?)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = $"Lỗi khi upload: {ex.Message}", data = (object?)null });
            }
        }

        /// <summary>
        /// Lấy dữ liệu Overview Dashboard - Tổng quan công việc
        /// </summary>
        [HttpGet("overview")]
        public async Task<ActionResult> GetOverview(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetOverviewAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Tiến độ công việc theo thời gian
        /// </summary>
        [HttpGet("task-progress")]
        public async Task<ActionResult> GetTaskProgress(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string periodType = "day",
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            if (periodType != "day" && periodType != "week" && periodType != "month")
                periodType = "day";

            var data = await _exportService.GetTaskProgressAsync(filter, periodType, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Công việc quá hạn & rủi ro
        /// </summary>
        [HttpGet("overdue-risks")]
        public async Task<ActionResult> GetOverdueRisks(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetOverdueRisksAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Phân bổ workload
        /// </summary>
        [HttpGet("workload")]
        public async Task<ActionResult> GetWorkloadDistribution(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId
            };

            var data = await _exportService.GetWorkloadDistributionAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Bottleneck & nguyên nhân
        /// </summary>
        [HttpGet("bottlenecks")]
        public async Task<ActionResult> GetBottlenecks(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetBottlenecksAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu SLA / Deadline compliance
        /// </summary>
        [HttpGet("sla-compliance")]
        public async Task<ActionResult> GetSLACompliance(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetSLAComplianceAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu So sánh các project
        /// </summary>
        [HttpGet("project-comparison")]
        public async Task<ActionResult> GetProjectComparison(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetProjectComparisonAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Export Overview Dashboard sang CSV file
        /// </summary>
        [HttpGet("overview/export/csv")]
        public async Task<IActionResult> ExportOverviewToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportOverviewToCsvAsync(filter, ct);
            var fileName = $"Overview_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Task Progress sang CSV file
        /// </summary>
        [HttpGet("task-progress/export/csv")]
        public async Task<IActionResult> ExportTaskProgressToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string periodType = "day",
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            if (periodType != "day" && periodType != "week" && periodType != "month")
                periodType = "day";

            var csvBytes = await _exportService.ExportTaskProgressToCsvAsync(filter, periodType, ct);
            var fileName = $"TaskProgress_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Overdue Risks sang CSV file
        /// </summary>
        [HttpGet("overdue-risks/export/csv")]
        public async Task<IActionResult> ExportOverdueRisksToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportOverdueRisksToCsvAsync(filter, ct);
            var fileName = $"OverdueRisks_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Workload Distribution sang CSV file
        /// </summary>
        [HttpGet("workload/export/csv")]
        public async Task<IActionResult> ExportWorkloadDistributionToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId
            };

            var csvBytes = await _exportService.ExportWorkloadDistributionToCsvAsync(filter, ct);
            var fileName = $"WorkloadDistribution_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Bottlenecks sang CSV file
        /// </summary>
        [HttpGet("bottlenecks/export/csv")]
        public async Task<IActionResult> ExportBottlenecksToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportBottlenecksToCsvAsync(filter, ct);
            var fileName = $"Bottlenecks_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export SLA Compliance sang CSV file
        /// </summary>
        [HttpGet("sla-compliance/export/csv")]
        public async Task<IActionResult> ExportSLAComplianceToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportSLAComplianceToCsvAsync(filter, ct);
            var fileName = $"SLACompliance_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Project Comparison sang CSV file
        /// </summary>
        [HttpGet("project-comparison/export/csv")]
        public async Task<IActionResult> ExportProjectComparisonToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportProjectComparisonToCsvAsync(filter, ct);
            var fileName = $"ProjectComparison_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Lấy danh sách tất cả các loại biểu đồ/data source có sẵn
        /// </summary>
        [HttpGet("data-sources")]
        public IActionResult GetAllDataSources()
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var dataSources = new List<PowerBIDataSourceDto>
            {
                new PowerBIDataSourceDto
                {
                    Id = "overview",
                    Name = "Tổng Quan Dashboard",
                    Description = "Dữ liệu tổng quan về tất cả projects và tasks",
                    Category = "Dashboard",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/overview",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/overview/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/overview/export/csv",
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate" },
                    Purpose = "Tạo dashboard tổng quan với các KPI chính: tổng số tasks, completion rate, overdue tasks, v.v.",
                    RecommendedCharts = new List<string> { "KPI Cards", "Pie Chart", "Bar Chart", "Gauge Chart" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "task-progress",
                    Name = "Tiến Độ Công Việc",
                    Description = "Dữ liệu tiến độ công việc theo thời gian (ngày/tuần/tháng)",
                    Category = "Time Series",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/task-progress",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/task-progress/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/task-progress/export/csv",
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate", "periodType" },
                    Purpose = "Phân tích xu hướng tiến độ công việc theo thời gian, số lượng task được tạo và hoàn thành",
                    RecommendedCharts = new List<string> { "Line Chart", "Area Chart", "Column Chart", "Waterfall Chart" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "overdue-risks",
                    Name = "Task Quá Hạn & Rủi Ro",
                    Description = "Danh sách các task quá hạn và có nguy cơ quá hạn",
                    Category = "Risk Management",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/overdue-risks",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/overdue-risks/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/overdue-risks/export/csv",
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate" },
                    Purpose = "Theo dõi và cảnh báo các task quá hạn, phân tích rủi ro dự án",
                    RecommendedCharts = new List<string> { "Table", "Bar Chart", "Heatmap", "Treemap" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "workload",
                    Name = "Phân Bổ Workload",
                    Description = "Phân bổ công việc theo user, team, department",
                    Category = "Resource Management",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/workload",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/workload/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/workload/export/csv",
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId" },
                    Purpose = "Phân tích phân bổ workload, xác định người/quyên bị quá tải hoặc thiếu công việc",
                    RecommendedCharts = new List<string> { "Bar Chart", "Pie Chart", "Funnel Chart", "Treemap" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "bottlenecks",
                    Name = "Bottleneck & Nguyên Nhân",
                    Description = "Phân tích các bottleneck và nguyên nhân chậm trễ",
                    Category = "Performance Analysis",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/bottlenecks",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/bottlenecks/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/bottlenecks/export/csv",
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate" },
                    Purpose = "Xác định các điểm nghẽn trong quy trình, phân tích nguyên nhân chậm trễ",
                    RecommendedCharts = new List<string> { "Bar Chart", "Scatter Chart", "Table", "Heatmap" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "sla-compliance",
                    Name = "SLA & Deadline Compliance",
                    Description = "Tỷ lệ tuân thủ SLA và deadline",
                    Category = "Quality Metrics",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/sla-compliance",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/sla-compliance/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/sla-compliance/export/csv",
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate" },
                    Purpose = "Đo lường tỷ lệ tuân thủ SLA, phân tích hiệu quả đáp ứng deadline",
                    RecommendedCharts = new List<string> { "Gauge Chart", "Bar Chart", "Line Chart", "KPI Cards" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "project-comparison",
                    Name = "So Sánh Dự Án",
                    Description = "So sánh hiệu suất giữa các dự án",
                    Category = "Comparative Analysis",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/project-comparison",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/project-comparison/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/project-comparison/export/csv",
                    SupportedFilters = new List<string> { "projectId", "departmentId", "teamId", "startDate", "endDate" },
                    Purpose = "So sánh hiệu suất, tiến độ, và chất lượng giữa các dự án",
                    RecommendedCharts = new List<string> { "Bar Chart", "Column Chart", "Scatter Chart", "Table" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "tasks",
                    Name = "Dữ Liệu Tasks (Raw)",
                    Description = "Dữ liệu chi tiết của tất cả tasks",
                    Category = "Raw Data",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/tasks",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/tasks/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/tasks/export/csv",
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate", "statuses", "priorities", "includeCompleted" },
                    Purpose = "Dữ liệu raw để phân tích chi tiết, tạo custom reports",
                    RecommendedCharts = new List<string> { "Table", "Matrix", "Custom Visuals" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "projects",
                    Name = "Dữ Liệu Projects (Raw)",
                    Description = "Dữ liệu chi tiết của tất cả projects",
                    Category = "Raw Data",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/projects",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/projects/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/projects/export/csv",
                    SupportedFilters = new List<string> { "projectId", "departmentId", "teamId", "startDate", "endDate" },
                    Purpose = "Dữ liệu raw về projects để phân tích chi tiết",
                    RecommendedCharts = new List<string> { "Table", "Matrix", "Custom Visuals" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "user-performance",
                    Name = "Hiệu Suất Người Dùng",
                    Description = "Dữ liệu về hiệu suất làm việc của từng user",
                    Category = "Performance",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/user-performance",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/user-performance/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/user-performance/export/csv",
                    SupportedFilters = new List<string> { "userId", "departmentId", "projectId" },
                    Purpose = "Đánh giá hiệu suất làm việc, completion rate, on-time delivery của từng user",
                    RecommendedCharts = new List<string> { "Bar Chart", "Gauge Chart", "Table", "KPI Cards" }
                },
                new PowerBIDataSourceDto
                {
                    Id = "time-tracking",
                    Name = "Theo Dõi Thời Gian",
                    Description = "Dữ liệu về estimated vs actual hours, efficiency",
                    Category = "Time Management",
                    JsonApiUrl = $"{baseUrl}/api/powerbi/time-tracking",
                    ExcelDownloadUrl = $"{baseUrl}/api/powerbi/time-tracking/excel",
                    CsvDownloadUrl = $"{baseUrl}/api/powerbi/time-tracking/export/csv",
                    SupportedFilters = new List<string> { "projectId", "userId", "startDate", "endDate" },
                    Purpose = "Phân tích chênh lệch giữa estimated và actual hours, hiệu quả sử dụng thời gian",
                    RecommendedCharts = new List<string> { "Bar Chart", "Line Chart", "Scatter Chart", "Waterfall Chart" }
                }
            };

            return Ok(new { code = 200, message = "Thành công", data = dataSources });
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một data source cụ thể
        /// </summary>
        [HttpGet("data-sources/{id}")]
        public async Task<IActionResult> GetDataSource(string id, 
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? statuses,
            [FromQuery] string? priorities,
            [FromQuery] bool? includeCompleted,
            [FromQuery] string? periodType,
            CancellationToken ct = default)
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var queryParams = new List<string>();
            if (projectId.HasValue) queryParams.Add($"projectId={projectId}");
            if (userId.HasValue) queryParams.Add($"userId={userId}");
            if (departmentId.HasValue) queryParams.Add($"departmentId={departmentId}");
            if (teamId.HasValue) queryParams.Add($"teamId={teamId}");
            if (startDate.HasValue) queryParams.Add($"startDate={startDate.Value:yyyy-MM-dd}");
            if (endDate.HasValue) queryParams.Add($"endDate={endDate.Value:yyyy-MM-dd}");
            if (!string.IsNullOrEmpty(statuses)) queryParams.Add($"statuses={Uri.EscapeDataString(statuses)}");
            if (!string.IsNullOrEmpty(priorities)) queryParams.Add($"priorities={Uri.EscapeDataString(priorities)}");
            if (includeCompleted.HasValue) queryParams.Add($"includeCompleted={includeCompleted}");
            if (!string.IsNullOrEmpty(periodType)) queryParams.Add($"periodType={Uri.EscapeDataString(periodType)}");
            
            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";

            var response = id.ToLower() switch
            {
                "overview" => new PowerBIDataSourceResponseDto
                {
                    Id = "overview",
                    Name = "Tổng Quan Dashboard",
                    Description = "Dữ liệu tổng quan về tất cả projects và tasks",
                    Purpose = "Tạo dashboard tổng quan với các KPI chính",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/overview{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/overview/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/overview/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo KPI cards, pie charts, bar charts"
                    },
                    RecommendedCharts = new List<string> { "KPI Cards", "Pie Chart", "Bar Chart", "Gauge Chart" },
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate" }
                },
                "task-progress" => new PowerBIDataSourceResponseDto
                {
                    Id = "task-progress",
                    Name = "Tiến Độ Công Việc",
                    Description = "Dữ liệu tiến độ công việc theo thời gian",
                    Purpose = "Phân tích xu hướng tiến độ công việc theo thời gian",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/task-progress{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/task-progress/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/task-progress/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo line charts, area charts theo thời gian"
                    },
                    RecommendedCharts = new List<string> { "Line Chart", "Area Chart", "Column Chart", "Waterfall Chart" },
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate", "periodType" }
                },
                "overdue-risks" => new PowerBIDataSourceResponseDto
                {
                    Id = "overdue-risks",
                    Name = "Task Quá Hạn & Rủi Ro",
                    Description = "Danh sách các task quá hạn và có nguy cơ quá hạn",
                    Purpose = "Theo dõi và cảnh báo các task quá hạn",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/overdue-risks{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/overdue-risks/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/overdue-risks/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo tables, bar charts, heatmaps"
                    },
                    RecommendedCharts = new List<string> { "Table", "Bar Chart", "Heatmap", "Treemap" },
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate" }
                },
                "workload" => new PowerBIDataSourceResponseDto
                {
                    Id = "workload",
                    Name = "Phân Bổ Workload",
                    Description = "Phân bổ công việc theo user, team, department",
                    Purpose = "Phân tích phân bổ workload",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/workload{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/workload/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/workload/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo bar charts, pie charts, treemaps"
                    },
                    RecommendedCharts = new List<string> { "Bar Chart", "Pie Chart", "Funnel Chart", "Treemap" },
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId" }
                },
                "bottlenecks" => new PowerBIDataSourceResponseDto
                {
                    Id = "bottlenecks",
                    Name = "Bottleneck & Nguyên Nhân",
                    Description = "Phân tích các bottleneck và nguyên nhân chậm trễ",
                    Purpose = "Xác định các điểm nghẽn trong quy trình",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/bottlenecks{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/bottlenecks/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/bottlenecks/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo bar charts, scatter charts, tables"
                    },
                    RecommendedCharts = new List<string> { "Bar Chart", "Scatter Chart", "Table", "Heatmap" },
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate" }
                },
                "sla-compliance" => new PowerBIDataSourceResponseDto
                {
                    Id = "sla-compliance",
                    Name = "SLA & Deadline Compliance",
                    Description = "Tỷ lệ tuân thủ SLA và deadline",
                    Purpose = "Đo lường tỷ lệ tuân thủ SLA",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/sla-compliance{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/sla-compliance/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/sla-compliance/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo gauge charts, KPI cards, bar charts"
                    },
                    RecommendedCharts = new List<string> { "Gauge Chart", "Bar Chart", "Line Chart", "KPI Cards" },
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate" }
                },
                "project-comparison" => new PowerBIDataSourceResponseDto
                {
                    Id = "project-comparison",
                    Name = "So Sánh Dự Án",
                    Description = "So sánh hiệu suất giữa các dự án",
                    Purpose = "So sánh hiệu suất giữa các dự án",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/project-comparison{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/project-comparison/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/project-comparison/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo bar charts, column charts, scatter charts"
                    },
                    RecommendedCharts = new List<string> { "Bar Chart", "Column Chart", "Scatter Chart", "Table" },
                    SupportedFilters = new List<string> { "projectId", "departmentId", "teamId", "startDate", "endDate" }
                },
                "tasks" => new PowerBIDataSourceResponseDto
                {
                    Id = "tasks",
                    Name = "Dữ Liệu Tasks (Raw)",
                    Description = "Dữ liệu chi tiết của tất cả tasks",
                    Purpose = "Dữ liệu raw để phân tích chi tiết",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/tasks{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/tasks/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/tasks/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo custom reports, tables, matrices"
                    },
                    RecommendedCharts = new List<string> { "Table", "Matrix", "Custom Visuals" },
                    SupportedFilters = new List<string> { "projectId", "userId", "departmentId", "teamId", "startDate", "endDate", "statuses", "priorities", "includeCompleted" }
                },
                "projects" => new PowerBIDataSourceResponseDto
                {
                    Id = "projects",
                    Name = "Dữ Liệu Projects (Raw)",
                    Description = "Dữ liệu chi tiết của tất cả projects",
                    Purpose = "Dữ liệu raw về projects để phân tích chi tiết",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/projects{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/projects/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/projects/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo custom reports, tables, matrices"
                    },
                    RecommendedCharts = new List<string> { "Table", "Matrix", "Custom Visuals" },
                    SupportedFilters = new List<string> { "projectId", "departmentId", "teamId", "startDate", "endDate" }
                },
                "user-performance" => new PowerBIDataSourceResponseDto
                {
                    Id = "user-performance",
                    Name = "Hiệu Suất Người Dùng",
                    Description = "Dữ liệu về hiệu suất làm việc của từng user",
                    Purpose = "Đánh giá hiệu suất làm việc của từng user",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/user-performance{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/user-performance/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/user-performance/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo bar charts, gauge charts, KPI cards"
                    },
                    RecommendedCharts = new List<string> { "Bar Chart", "Gauge Chart", "Table", "KPI Cards" },
                    SupportedFilters = new List<string> { "userId", "departmentId", "projectId" }
                },
                "time-tracking" => new PowerBIDataSourceResponseDto
                {
                    Id = "time-tracking",
                    Name = "Theo Dõi Thời Gian",
                    Description = "Dữ liệu về estimated vs actual hours, efficiency",
                    Purpose = "Phân tích chênh lệch giữa estimated và actual hours",
                    Links = new PowerBIDataSourceLinksDto
                    {
                        JsonApiUrl = $"{baseUrl}/api/powerbi/time-tracking{queryString}",
                        ExcelDownloadUrl = $"{baseUrl}/api/powerbi/time-tracking/excel{queryString}",
                        CsvDownloadUrl = $"{baseUrl}/api/powerbi/time-tracking/export/csv{queryString}",
                        UsageInstructions = "1. Import vào Power BI: Get Data > Web > Nhập JsonApiUrl\n2. Hoặc download Excel: Click ExcelDownloadUrl\n3. Sử dụng để tạo bar charts, line charts, scatter charts"
                    },
                    RecommendedCharts = new List<string> { "Bar Chart", "Line Chart", "Scatter Chart", "Waterfall Chart" },
                    SupportedFilters = new List<string> { "projectId", "userId", "startDate", "endDate" }
                },
                _ => null
            };

            if (response == null)
                return NotFound(new { code = 404, message = $"Không tìm thấy data source với ID: {id}", data = (object?)null });

            return Ok(new { code = 200, message = "Thành công", data = response });
        }

        // Excel Export Endpoints
        [HttpGet("overview/excel")]
        public async Task<IActionResult> ExportOverviewToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportOverviewToExcelAsync(filter, ct);
            var fileName = $"Overview_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("task-progress/excel")]
        public async Task<IActionResult> ExportTaskProgressToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string periodType = "day",
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            if (periodType != "day" && periodType != "week" && periodType != "month")
                periodType = "day";

            var excelBytes = await _exportService.ExportTaskProgressToExcelAsync(filter, periodType, ct);
            var fileName = $"TaskProgress_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("overdue-risks/excel")]
        public async Task<IActionResult> ExportOverdueRisksToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportOverdueRisksToExcelAsync(filter, ct);
            var fileName = $"OverdueRisks_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("workload/excel")]
        public async Task<IActionResult> ExportWorkloadDistributionToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId
            };

            var excelBytes = await _exportService.ExportWorkloadDistributionToExcelAsync(filter, ct);
            var fileName = $"WorkloadDistribution_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("bottlenecks/excel")]
        public async Task<IActionResult> ExportBottlenecksToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportBottlenecksToExcelAsync(filter, ct);
            var fileName = $"Bottlenecks_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("sla-compliance/excel")]
        public async Task<IActionResult> ExportSLAComplianceToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportSLAComplianceToExcelAsync(filter, ct);
            var fileName = $"SLACompliance_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("project-comparison/excel")]
        public async Task<IActionResult> ExportProjectComparisonToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportProjectComparisonToExcelAsync(filter, ct);
            var fileName = $"ProjectComparison_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("tasks/excel")]
        public async Task<IActionResult> ExportTasksToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? statuses,
            [FromQuery] string? priorities,
            [FromQuery] bool? includeCompleted,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate,
                Statuses = !string.IsNullOrEmpty(statuses) ? statuses.Split(',').ToList() : null,
                Priorities = !string.IsNullOrEmpty(priorities) ? priorities.Split(',').ToList() : null,
                IncludeCompleted = includeCompleted ?? true
            };

            var excelBytes = await _exportService.ExportTasksToExcelAsync(filter, ct);
            var fileName = $"Tasks_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("projects/excel")]
        public async Task<IActionResult> ExportProjectsToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportProjectsToExcelAsync(filter, ct);
            var fileName = $"Projects_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("user-performance/excel")]
        public async Task<IActionResult> ExportUserPerformanceToExcel(
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? projectId,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                UserId = userId,
                DepartmentId = departmentId,
                ProjectId = projectId
            };

            var excelBytes = await _exportService.ExportUserPerformanceToExcelAsync(filter, ct);
            var fileName = $"UserPerformance_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("time-tracking/excel")]
        public async Task<IActionResult> ExportTimeTrackingToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportTimeTrackingToExcelAsync(filter, ct);
            var fileName = $"TimeTracking_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        // ========== Phase 1: Advanced Metrics APIs ==========

        /// <summary>
        /// Lấy dữ liệu Communication & Collaboration Metrics
        /// </summary>
        [HttpGet("communication-metrics")]
        public async Task<ActionResult> GetCommunicationMetrics(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetCommunicationMetricsAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Task Lifecycle & Velocity Metrics
        /// </summary>
        [HttpGet("task-lifecycle")]
        public async Task<ActionResult> GetTaskLifecycle(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetTaskLifecycleMetricsAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Sprint & Agile Metrics
        /// </summary>
        [HttpGet("sprint-metrics")]
        public async Task<ActionResult> GetSprintMetrics(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _exportService.GetSprintMetricsAsync(filter, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Lấy dữ liệu Sprint Burndown
        /// </summary>
        [HttpGet("sprint-burndown")]
        public async Task<ActionResult> GetSprintBurndown(
            [FromQuery] long sprintId,
            CancellationToken ct = default)
        {
            var data = await _exportService.GetSprintBurndownAsync(sprintId, ct);
            return Ok(new { code = 200, message = "Thành công", data });
        }

        /// <summary>
        /// Export Communication Metrics sang CSV
        /// </summary>
        [HttpGet("communication-metrics/export/csv")]
        public async Task<IActionResult> ExportCommunicationMetricsToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportCommunicationMetricsToCsvAsync(filter, ct);
            var fileName = $"CommunicationMetrics_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Task Lifecycle sang CSV
        /// </summary>
        [HttpGet("task-lifecycle/export/csv")]
        public async Task<IActionResult> ExportTaskLifecycleToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportTaskLifecycleToCsvAsync(filter, ct);
            var fileName = $"TaskLifecycle_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Sprint Metrics sang CSV
        /// </summary>
        [HttpGet("sprint-metrics/export/csv")]
        public async Task<IActionResult> ExportSprintMetricsToCsv(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var csvBytes = await _exportService.ExportSprintMetricsToCsvAsync(filter, ct);
            var fileName = $"SprintMetrics_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Export Communication Metrics sang Excel
        /// </summary>
        [HttpGet("communication-metrics/excel")]
        public async Task<IActionResult> ExportCommunicationMetricsToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportCommunicationMetricsToExcelAsync(filter, ct);
            var fileName = $"CommunicationMetrics_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        /// <summary>
        /// Export Task Lifecycle sang Excel
        /// </summary>
        [HttpGet("task-lifecycle/excel")]
        public async Task<IActionResult> ExportTaskLifecycleToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? userId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                UserId = userId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportTaskLifecycleToExcelAsync(filter, ct);
            var fileName = $"TaskLifecycle_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        /// <summary>
        /// Export Sprint Metrics sang Excel
        /// </summary>
        [HttpGet("sprint-metrics/excel")]
        public async Task<IActionResult> ExportSprintMetricsToExcel(
            [FromQuery] long? projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? teamId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            var filter = new PowerBIExportFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                TeamId = teamId,
                StartDate = startDate,
                EndDate = endDate
            };

            var excelBytes = await _exportService.ExportSprintMetricsToExcelAsync(filter, ct);
            var fileName = $"SprintMetrics_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
    }
}
