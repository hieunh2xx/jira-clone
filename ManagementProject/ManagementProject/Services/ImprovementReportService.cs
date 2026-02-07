using DataAccess.Models;
using ManagementProject.DTO;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ManagementProject.Services
{
    public interface IImprovementReportService
    {
        /// <summary>
        /// Lấy danh sách đề xuất cải tiến (Kaizen/SKCT) của một dự án cụ thể
        /// </summary>
        Task<List<ImprovementSuggestionReportDto>> GetImprovementSuggestionsAsync(
            ImprovementFilterDto? filter = null, 
            CancellationToken ct = default);

        /// <summary>
        /// Lấy báo cáo cải tiến theo phòng ban của một dự án cụ thể
        /// </summary>
        Task<List<ImprovementByDepartmentReportDto>> GetImprovementByDepartmentAsync(
            long projectId,
            DateTime? startDate = null, 
            DateTime? endDate = null, 
            CancellationToken ct = default);

        /// <summary>
        /// Lấy báo cáo hiệu quả hàng tháng của một dự án cụ thể
        /// </summary>
        Task<List<MonthlyImprovementEffectivenessDto>> GetMonthlyEffectivenessAsync(
            long projectId,
            int? year = null, 
            CancellationToken ct = default);

        /// <summary>
        /// Lấy báo cáo tỷ lệ cải tiến theo cấp độ của một dự án cụ thể
        /// </summary>
        Task<List<ImprovementLevelRateDto>> GetImprovementLevelRateAsync(
            long projectId,
            DateTime? startDate = null, 
            DateTime? endDate = null, 
            CancellationToken ct = default);

        /// <summary>
        /// Lấy tỷ lệ cải tiến cấp trung theo phòng ban và tháng của một dự án cụ thể
        /// </summary>
        Task<List<MediumLevelImprovementRateDto>> GetMediumLevelRateByDepartmentAndMonthAsync(
            long projectId,
            DateTime? startDate = null, 
            DateTime? endDate = null, 
            CancellationToken ct = default);

        /// <summary>
        /// Lấy báo cáo tổng thể cải tiến của một dự án cụ thể
        /// </summary>
        Task<List<CompanyWideImprovementDto>> GetCompanyWideImprovementAsync(
            long projectId,
            int? year = null, 
            CancellationToken ct = default);
    }

    public class ImprovementReportService : IImprovementReportService
    {
        private readonly ProjectManagementDbContext _ctx;

        public ImprovementReportService(ProjectManagementDbContext ctx)
        {
            _ctx = ctx;
        }

        public async Task<List<ImprovementSuggestionReportDto>> GetImprovementSuggestionsAsync(
            ImprovementFilterDto? filter = null, 
            CancellationToken ct = default)
        {
            // Tạm thời sử dụng ProjectImprovement model
            var query = _ctx.ProjectImprovements
                .AsNoTracking()
                .Include(pi => pi.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Department)
                .Include(pi => pi.CreatedByNavigation)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.DepartmentId.HasValue)
                    query = query.Where(pi => pi.Project.Team.DepartmentId == filter.DepartmentId.Value);

                if (filter.StartDate.HasValue)
                    query = query.Where(pi => pi.CreatedAt >= filter.StartDate.Value);

                if (filter.EndDate.HasValue)
                    query = query.Where(pi => pi.CreatedAt <= filter.EndDate.Value);

                if (!string.IsNullOrEmpty(filter.Status))
                    query = query.Where(pi => pi.Status == filter.Status);

                if (filter.IncludeRejected == false)
                    query = query.Where(pi => pi.Status != "rejected");
            }

            var improvements = await query.ToListAsync(ct);

            var result = improvements.Select(pi => new ImprovementSuggestionReportDto
            {
                SuggestionId = pi.Id,
                SuggestionTitle = pi.Title ?? "Untitled",
                SuggestionDescription = pi.Description ?? string.Empty,
                CreatedDate = pi.CreatedAt,
                CreatedByUserId = pi.CreatedBy,
                CreatedByName = pi.CreatedByNavigation != null 
                    ? $"{pi.CreatedByNavigation.FirstName} {pi.CreatedByNavigation.LastName}".Trim()
                    : null,
                DepartmentId = pi.Project.Team.Department?.Id ?? 0,
                DepartmentName = pi.Project.Team.Department?.Name ?? "Unknown",
                Status = pi.Status ?? "submitted",
                ImplementedDate = pi.UpdatedAt,
                ExpectedBenefitUSD = pi.ExpectedBenefit,
                ActualBenefitUSD = pi.ActualBenefit,
                ParticipantsCount = pi.ParticipantsCount ?? 0,
                Category = pi.Category ?? "General",
                LevelOfImprovement = pi.Level ?? 1
            }).ToList();

            return result;
        }

        public async Task<List<ImprovementByDepartmentReportDto>> GetImprovementByDepartmentAsync(
            long projectId,
            DateTime? startDate = null, 
            DateTime? endDate = null, 
            CancellationToken ct = default)
        {
            var query = _ctx.ProjectImprovements
                .AsNoTracking()
                .Include(pi => pi.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Department)
                .Where(pi => pi.ProjectId == projectId)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(pi => pi.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(pi => pi.CreatedAt <= endDate.Value);

            var improvements = await query.ToListAsync(ct);

            var grouped = improvements
                .GroupBy(pi => new { pi.Project.Team.Department?.Id, pi.Project.Team.Department?.Name })
                .Select(g => new ImprovementByDepartmentReportDto
                {
                    DepartmentId = g.Key.Id ?? 0,
                    DepartmentName = g.Key.Name ?? "Unknown",
                    TotalSuggestions = g.Count(),
                    ApprovedSuggestions = g.Count(pi => pi.Status == "approved"),
                    ImplementedSuggestions = g.Count(pi => pi.Status == "implemented"),
                    TotalBenefitUSD = g.Where(pi => pi.ActualBenefit.HasValue).Sum(pi => pi.ActualBenefit ?? 0),
                    AverageBenefitUSD = g.Where(pi => pi.ActualBenefit.HasValue).Any() 
                        ? g.Where(pi => pi.ActualBenefit.HasValue).Average(pi => pi.ActualBenefit ?? 0)
                        : 0,
                    TotalParticipants = g.Sum(pi => pi.ParticipantsCount ?? 0),
                    UniqueParticipantsCount = 0, // Would need separate participant table
                    ImplementationRate = g.Any() ? (double)g.Count(pi => pi.Status == "implemented") / g.Count() * 100 : 0,
                    ApprovalRate = g.Any() ? (double)g.Count(pi => pi.Status == "approved") / g.Count() * 100 : 0
                })
                .OrderBy(x => x.DepartmentName)
                .ToList();

            return grouped;
        }

        public async Task<List<MonthlyImprovementEffectivenessDto>> GetMonthlyEffectivenessAsync(
            long projectId,
            int? year = null, 
            CancellationToken ct = default)
        {
            var targetYear = year ?? DateTime.Now.Year;

            var query = _ctx.ProjectImprovements
                .AsNoTracking()
                .Where(pi => pi.ProjectId == projectId && pi.CreatedAt.HasValue && pi.CreatedAt.Value.Year == targetYear)
                .AsQueryable();

            var improvements = await query.ToListAsync(ct);

            var grouped = improvements
                .GroupBy(pi => new { Year = pi.CreatedAt!.Value.Year, Month = pi.CreatedAt!.Value.Month })
                .Select(g => new MonthlyImprovementEffectivenessDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM", new CultureInfo("vi-VN")),
                    SuggestionsSubmitted = g.Count(),
                    SuggestionsApproved = g.Count(pi => pi.Status == "approved"),
                    SuggestionsImplemented = g.Count(pi => pi.Status == "implemented"),
                    TotalBenefitUSD = g.Sum(pi => pi.ActualBenefit ?? 0),
                    TotalParticipants = g.Sum(pi => pi.ParticipantsCount ?? 0),
                    CompletionRate = g.Any() ? (double)g.Count(pi => pi.Status == "implemented") / g.Count() * 100 : 0,
                    ApprovalRate = g.Any() ? (double)g.Count(pi => pi.Status == "approved") / g.Count() * 100 : 0,
                    AverageBenefitPerSuggestion = g.Any(pi => pi.ActualBenefit.HasValue) 
                        ? g.Where(pi => pi.ActualBenefit.HasValue).Average(pi => pi.ActualBenefit ?? 0)
                        : 0
                })
                .OrderBy(x => x.Month)
                .ToList();

            return grouped;
        }

        public async Task<List<ImprovementLevelRateDto>> GetImprovementLevelRateAsync(
            long projectId,
            DateTime? startDate = null, 
            DateTime? endDate = null, 
            CancellationToken ct = default)
        {
            var query = _ctx.ProjectImprovements
                .AsNoTracking()
                .Include(pi => pi.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Department)
                .Where(pi => pi.ProjectId == projectId)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(pi => pi.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(pi => pi.CreatedAt <= endDate.Value);

            var improvements = await query.ToListAsync(ct);

            var grouped = improvements
                .GroupBy(pi => new { pi.Project.Team.Department?.Id, pi.Project.Team.Department?.Name })
                .Select(g => new ImprovementLevelRateDto
                {
                    DepartmentId = g.Key.Id ?? 0,
                    DepartmentName = g.Key.Name ?? "Unknown",
                    TotalSuggestions = g.Count(),
                    LowLevelCount = g.Count(pi => pi.Level == 1),
                    MediumLevelCount = g.Count(pi => pi.Level == 2),
                    HighLevelCount = g.Count(pi => pi.Level == 3),
                    LowLevelRate = g.Any() ? (double)g.Count(pi => pi.Level == 1) / g.Count() * 100 : 0,
                    MediumLevelRate = g.Any() ? (double)g.Count(pi => pi.Level == 2) / g.Count() * 100 : 0,
                    HighLevelRate = g.Any() ? (double)g.Count(pi => pi.Level == 3) / g.Count() * 100 : 0
                })
                .OrderBy(x => x.DepartmentName)
                .ToList();

            return grouped;
        }

        public async Task<List<MediumLevelImprovementRateDto>> GetMediumLevelRateByDepartmentAndMonthAsync(
            long projectId,
            DateTime? startDate = null, 
            DateTime? endDate = null, 
            CancellationToken ct = default)
        {
            var query = _ctx.ProjectImprovements
                .AsNoTracking()
                .Include(pi => pi.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Department)
                .Where(pi => pi.ProjectId == projectId)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(pi => pi.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(pi => pi.CreatedAt <= endDate.Value);

            var improvements = await query.ToListAsync(ct);

            var grouped = improvements
                .GroupBy(pi => new
                {
                    pi.Project.Team.Department?.Id,
                    pi.Project.Team.Department?.Name,
                    Year = pi.CreatedAt!.Value.Year,
                    Month = pi.CreatedAt!.Value.Month
                })
                .Select(g => new MediumLevelImprovementRateDto
                {
                    DepartmentId = g.Key.Id ?? 0,
                    DepartmentName = g.Key.Name ?? "Unknown",
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM", new CultureInfo("vi-VN")),
                    TotalSuggestions = g.Count(),
                    MediumLevelSuggestions = g.Count(pi => pi.Level == 2),
                    MediumLevelRate = g.Any() ? (double)g.Count(pi => pi.Level == 2) / g.Count() * 100 : 0
                })
                .OrderBy(x => x.DepartmentName)
                .ThenBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            return grouped;
        }

        public async Task<List<CompanyWideImprovementDto>> GetCompanyWideImprovementAsync(
            long projectId,
            int? year = null, 
            CancellationToken ct = default)
        {
            var targetYear = year ?? DateTime.Now.Year;

            var query = _ctx.ProjectImprovements
                .AsNoTracking()
                .Where(pi => pi.ProjectId == projectId && pi.CreatedAt.HasValue && pi.CreatedAt.Value.Year == targetYear)
                .AsQueryable();

            var improvements = await query.ToListAsync(ct);

            var grouped = improvements
                .GroupBy(pi => new { Year = pi.CreatedAt!.Value.Year, Month = pi.CreatedAt!.Value.Month })
                .Select(g => new CompanyWideImprovementDto
                {
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM", new CultureInfo("vi-VN")),
                    TotalSuggestionsCount = g.Count(),
                    TotalBenefitUSD = g.Sum(pi => pi.ActualBenefit ?? 0),
                    TotalParticipantsCount = g.Sum(pi => pi.ParticipantsCount ?? 0),
                    LowLevelRate = g.Any() ? (double)g.Count(pi => pi.Level == 1) / g.Count() * 100 : 0,
                    MediumLevelRate = g.Any() ? (double)g.Count(pi => pi.Level == 2) / g.Count() * 100 : 0,
                    HighLevelRate = g.Any() ? (double)g.Count(pi => pi.Level == 3) / g.Count() * 100 : 0,
                    ImplementationRate = g.Any() ? (double)g.Count(pi => pi.Status == "implemented") / g.Count() * 100 : 0,
                    ApprovalRate = g.Any() ? (double)g.Count(pi => pi.Status == "approved") / g.Count() * 100 : 0
                })
                .OrderBy(x => x.Month)
                .ToList();

            return grouped;
        }
    }
}
