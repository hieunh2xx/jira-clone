using ManagementProject.DTO;
using ManagementProject.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ManagementProject.Controllers
{
    [ApiController]
    [Route("api/reports/improvement")]
    [Authorize]
    public class ImprovementReportController : ControllerBase
    {
        private readonly IImprovementReportService _reportService;

        public ImprovementReportController(IImprovementReportService reportService)
        {
            _reportService = reportService;
        }

        /// <summary>
        /// Lấy danh sách đề xuất cải tiến (Kaizen/SKCT) của dự án cụ thể
        /// </summary>
        /// <remarks>
        /// Chỉ có thể xem dữ liệu của dự án được chỉ định (projectId bắt buộc)
        /// </remarks>
        [HttpGet("projects/{projectId}/suggestions")]
        public async Task<ActionResult> GetSuggestions(
            [FromRoute] long projectId,
            [FromQuery] long? departmentId,
            [FromQuery] long? userId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? status,
            [FromQuery] int? level,
            [FromQuery] bool? includeRejected = false,
            CancellationToken ct = default)
        {
            try
            {
                var filter = new ImprovementFilterDto
                {
                    ProjectId = projectId,
                    DepartmentId = departmentId,
                    UserId = userId,
                    StartDate = startDate,
                    EndDate = endDate,
                    Status = status,
                    LevelOfImprovement = level,
                    IncludeRejected = includeRejected
                };

                var result = await _reportService.GetImprovementSuggestionsAsync(filter, ct);
                return Ok(new { code = 200, message = "Thành công", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
            }
        }

        /// <summary>
        /// Báo cáo cải tiến theo phòng ban của dự án cụ thể - dùng cho Power BI
        /// Số người viết SKCT/phòng 改善参加人数/部署
        /// Chỉ có thể xem dữ liệu của dự án được chỉ định (projectId bắt buộc)
        /// </summary>
        [HttpGet("projects/{projectId}/by-department")]
        public async Task<ActionResult> GetByDepartment(
            [FromRoute] long projectId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            try
            {
                var result = await _reportService.GetImprovementByDepartmentAsync(projectId, startDate, endDate, ct);
                return Ok(new { code = 200, message = "Thành công", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
            }
        }

        /// <summary>
        /// Báo cáo hiệu quả hàng tháng của dự án cụ thể - Số Tiền hiệu quả/tháng 効果金額/月(USD)
        /// Chỉ có thể xem dữ liệu của dự án được chỉ định (projectId bắt buộc)
        /// </summary>
        [HttpGet("projects/{projectId}/monthly-effectiveness")]
        public async Task<ActionResult> GetMonthlyEffectiveness(
            [FromRoute] long projectId,
            [FromQuery] int? year,
            CancellationToken ct = default)
        {
            try
            {
                var result = await _reportService.GetMonthlyEffectivenessAsync(projectId, year, ct);
                return Ok(new { code = 200, message = "Thành công", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
            }
        }

        /// <summary>
        /// Báo cáo tỷ lệ cải tiến theo cấp độ của dự án cụ thể
        /// Tỷ lệ cấp trung phòng/tháng - 中級改善率/部署
        /// Chỉ có thể xem dữ liệu của dự án được chỉ định (projectId bắt buộc)
        /// </summary>
        [HttpGet("projects/{projectId}/level-rate")]
        public async Task<ActionResult> GetLevelRate(
            [FromRoute] long projectId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            try
            {
                var result = await _reportService.GetImprovementLevelRateAsync(projectId, startDate, endDate, ct);
                return Ok(new { code = 200, message = "Thành công", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
            }
        }

        /// <summary>
        /// Tỷ lệ cải tiến cấp trung theo phòng ban và tháng của dự án cụ thể
        /// Chỉ có thể xem dữ liệu của dự án được chỉ định (projectId bắt buộc)
        /// </summary>
        [HttpGet("projects/{projectId}/medium-level-rate")]
        public async Task<ActionResult> GetMediumLevelRate(
            [FromRoute] long projectId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken ct = default)
        {
            try
            {
                var result = await _reportService.GetMediumLevelRateByDepartmentAndMonthAsync(projectId, startDate, endDate, ct);
                return Ok(new { code = 200, message = "Thành công", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
            }
        }

        /// <summary>
        /// Báo cáo tổng thể cải tiến của dự án cụ thể
        /// Tỷ lệ SKCT/tháng 会社の中級改善率/月
        /// Chỉ có thể xem dữ liệu của dự án được chỉ định (projectId bắt buộc)
        /// </summary>
        [HttpGet("projects/{projectId}/company-wide")]
        public async Task<ActionResult> GetCompanyWide(
            [FromRoute] long projectId,
            [FromQuery] int? year,
            CancellationToken ct = default)
        {
            try
            {
                var result = await _reportService.GetCompanyWideImprovementAsync(projectId, year, ct);
                return Ok(new { code = 200, message = "Thành công", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
            }
        }

        /// <summary>
        /// Export dữ liệu CSV cho Power BI của dự án cụ thể
        /// Chỉ có thể export dữ liệu của dự án được chỉ định (projectId bắt buộc)
        /// </summary>
        [HttpGet("projects/{projectId}/export-csv")]
        public async Task<ActionResult> ExportCsv(
            [FromRoute] long projectId,
            [FromQuery] long? departmentId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? year,
            [FromQuery] string? reportType = "suggestions",
            CancellationToken ct = default)
        {
            try
            {
                var csvContent = reportType?.ToLower() switch
                {
                    "by-department" => await ExportByDepartmentToCsv(projectId, ct: ct, startDate: startDate, endDate: endDate),
                    "monthly" => await ExportMonthlyToCsv(projectId, ct: ct, year: year),
                    "level-rate" => await ExportLevelRateToCsv(projectId, ct: ct, startDate: startDate, endDate: endDate),
                    "medium-level" => await ExportMediumLevelToCsv(projectId, ct: ct, startDate: startDate, endDate: endDate),
                    "company-wide" => await ExportCompanyWideToCsv(projectId, ct: ct, year: year),
                    _ => await ExportSuggestionsToCsv(projectId, ct: ct, departmentId: departmentId, startDate: startDate, endDate: endDate)
                };

                return File(System.Text.Encoding.UTF8.GetBytes(csvContent), 
                    "text/csv", 
                    $"improvement-report-{DateTime.Now:yyyyMMddHHmmss}.csv");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = 500, message = ex.Message, data = (object?)null });
            }
        }

        private async Task<string> ExportSuggestionsToCsv(long projectId, CancellationToken ct = default, long? departmentId = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            var filter = new ImprovementFilterDto
            {
                ProjectId = projectId,
                DepartmentId = departmentId,
                StartDate = startDate,
                EndDate = endDate
            };

            var data = await _reportService.GetImprovementSuggestionsAsync(filter, ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("ID,Tiêu đề,Mô tả,Ngày tạo,Người tạo,Phòng ban,Trạng thái,Ngày thực hiện,Lợi ích dự tính (USD),Lợi ích thực tế (USD),Số người tham gia,Danh mục,Cấp độ");

            foreach (var item in data)
            {
                csv.AppendLine($"\"{item.SuggestionId}\",\"{item.SuggestionTitle}\",\"{item.SuggestionDescription?.Replace("\"", "\"\"")}\",\"{item.CreatedDate:yyyy-MM-dd}\",\"{item.CreatedByName}\",\"{item.DepartmentName}\",\"{item.Status}\",\"{item.ImplementedDate:yyyy-MM-dd}\",{item.ExpectedBenefitUSD},{item.ActualBenefitUSD},{item.ParticipantsCount},\"{item.Category}\",{item.LevelOfImprovement}");
            }

            return csv.ToString();
        }

        private async Task<string> ExportByDepartmentToCsv(long projectId, CancellationToken ct = default, DateTime? startDate = null, DateTime? endDate = null)
        {
            var data = await _reportService.GetImprovementByDepartmentAsync(projectId, startDate, endDate, ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Phòng ban,Tổng đề xuất,Đề xuất được phê duyệt,Đề xuất được thực hiện,Tổng lợi ích (USD),Lợi ích bình quân (USD),Tổng số người tham gia,Tỷ lệ thực hiện (%),Tỷ lệ phê duyệt (%)");

            foreach (var item in data)
            {
                csv.AppendLine($"\"{item.DepartmentName}\",{item.TotalSuggestions},{item.ApprovedSuggestions},{item.ImplementedSuggestions},{item.TotalBenefitUSD:F2},{item.AverageBenefitUSD:F2},{item.TotalParticipants},{item.ImplementationRate:F2},{item.ApprovalRate:F2}");
            }

            return csv.ToString();
        }

        private async Task<string> ExportMonthlyToCsv(long projectId, CancellationToken ct = default, int? year = null)
        {
            var data = await _reportService.GetMonthlyEffectivenessAsync(projectId, year, ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Tháng,Đề xuất,Phê duyệt,Thực hiện,Tổng lợi ích (USD),Tổng người tham gia,Tỷ lệ hoàn thành (%),Tỷ lệ phê duyệt (%),Lợi ích bình quân (USD)");

            foreach (var item in data)
            {
                csv.AppendLine($"\"{item.MonthName} {item.Year}\",{item.SuggestionsSubmitted},{item.SuggestionsApproved},{item.SuggestionsImplemented},{item.TotalBenefitUSD:F2},{item.TotalParticipants},{item.CompletionRate:F2},{item.ApprovalRate:F2},{item.AverageBenefitPerSuggestion:F2}");
            }

            return csv.ToString();
        }

        private async Task<string> ExportLevelRateToCsv(long projectId, CancellationToken ct = default, DateTime? startDate = null, DateTime? endDate = null)
        {
            var data = await _reportService.GetImprovementLevelRateAsync(projectId, startDate, endDate, ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Phòng ban,Tổng đề xuất,Cấp thấp,Cấp trung,Cấp cao,Tỷ lệ cấp thấp (%),Tỷ lệ cấp trung (%),Tỷ lệ cấp cao (%)");

            foreach (var item in data)
            {
                csv.AppendLine($"\"{item.DepartmentName}\",{item.TotalSuggestions},{item.LowLevelCount},{item.MediumLevelCount},{item.HighLevelCount},{item.LowLevelRate:F2},{item.MediumLevelRate:F2},{item.HighLevelRate:F2}");
            }

            return csv.ToString();
        }

        private async Task<string> ExportMediumLevelToCsv(long projectId, CancellationToken ct = default, DateTime? startDate = null, DateTime? endDate = null)
        {
            var data = await _reportService.GetMediumLevelRateByDepartmentAndMonthAsync(projectId, startDate, endDate, ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Phòng ban,Tháng,Tổng đề xuất,Cấp trung,Tỷ lệ cấp trung (%)");

            foreach (var item in data)
            {
                csv.AppendLine($"\"{item.DepartmentName}\",\"{item.MonthName} {item.Year}\",{item.TotalSuggestions},{item.MediumLevelSuggestions},{item.MediumLevelRate:F2}");
            }

            return csv.ToString();
        }

        private async Task<string> ExportCompanyWideToCsv(long projectId, CancellationToken ct = default, int? year = null)
        {
            var data = await _reportService.GetCompanyWideImprovementAsync(projectId, year, ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Tháng,Tổng đề xuất,Tổng lợi ích (USD),Tổng người tham gia,Tỷ lệ cấp thấp (%),Tỷ lệ cấp trung (%),Tỷ lệ cấp cao (%),Tỷ lệ thực hiện (%),Tỷ lệ phê duyệt (%)");

            foreach (var item in data)
            {
                csv.AppendLine($"\"{item.MonthName} {item.Year}\",{item.TotalSuggestionsCount},{item.TotalBenefitUSD:F2},{item.TotalParticipantsCount},{item.LowLevelRate:F2},{item.MediumLevelRate:F2},{item.HighLevelRate:F2},{item.ImplementationRate:F2},{item.ApprovalRate:F2}");
            }

            return csv.ToString();
        }
    }
}
