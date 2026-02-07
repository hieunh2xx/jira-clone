using System;
using System.Collections.Generic;

namespace ManagementProject.DTO
{
    /// <summary>
    /// DTO cho dữ liệu Improvement Suggestion (Đề xuất cải tiến) - Power BI
    /// </summary>
    public class ImprovementSuggestionReportDto
    {
        public long SuggestionId { get; set; }
        public string SuggestionTitle { get; set; } = null!;
        public string SuggestionDescription { get; set; } = null!;
        public DateTime? CreatedDate { get; set; }
        public long? CreatedByUserId { get; set; }
        public string? CreatedByName { get; set; }
        public long DepartmentId { get; set; }
        public string DepartmentName { get; set; } = null!;
        public string Status { get; set; } = null!; // Submitted, Under Review, Approved, Implemented, Rejected
        public DateTime? ImplementedDate { get; set; }
        public decimal? ExpectedBenefitUSD { get; set; }
        public decimal? ActualBenefitUSD { get; set; }
        public int ParticipantsCount { get; set; }
        public string? Category { get; set; } // Chất lượng, Chi phí, Năng suất, v.v.
        public int LevelOfImprovement { get; set; } // 1: Cấp thấp, 2: Cấp trung, 3: Cấp cao
    }

    /// <summary>
    /// Báo cáo tóm tắt cải tiến theo phòng ban
    /// </summary>
    public class ImprovementByDepartmentReportDto
    {
        public long DepartmentId { get; set; }
        public string DepartmentName { get; set; } = null!;
        public int TotalSuggestions { get; set; }
        public int ApprovedSuggestions { get; set; }
        public int ImplementedSuggestions { get; set; }
        public decimal AverageBenefitUSD { get; set; }
        public decimal TotalBenefitUSD { get; set; }
        public int TotalParticipants { get; set; }
        public int UniqueParticipantsCount { get; set; }
        public double ImplementationRate { get; set; } // %
        public double ApprovalRate { get; set; } // %
    }

    /// <summary>
    /// Báo cáo hiệu quả hàng tháng
    /// </summary>
    public class MonthlyImprovementEffectivenessDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = null!;
        public int SuggestionsSubmitted { get; set; }
        public int SuggestionsApproved { get; set; }
        public int SuggestionsImplemented { get; set; }
        public decimal TotalBenefitUSD { get; set; }
        public int TotalParticipants { get; set; }
        public double CompletionRate { get; set; } // %
        public double ApprovalRate { get; set; } // %
        public decimal AverageBenefitPerSuggestion { get; set; }
    }

    /// <summary>
    /// Báo cáo tỷ lệ cải tiến cấp độ
    /// </summary>
    public class ImprovementLevelRateDto
    {
        public long DepartmentId { get; set; }
        public string DepartmentName { get; set; } = null!;
        public int TotalSuggestions { get; set; }
        public int LowLevelCount { get; set; } // Cấp thấp
        public int MediumLevelCount { get; set; } // Cấp trung
        public int HighLevelCount { get; set; } // Cấp cao
        public double LowLevelRate { get; set; } // %
        public double MediumLevelRate { get; set; } // %
        public double HighLevelRate { get; set; } // %
    }

    /// <summary>
    /// Báo cáo tỷ lệ cải tiến cấp trung theo phòng ban
    /// </summary>
    public class MediumLevelImprovementRateDto
    {
        public long DepartmentId { get; set; }
        public string DepartmentName { get; set; } = null!;
        public int Month { get; set; }
        public int Year { get; set; }
        public string MonthName { get; set; } = null!;
        public int TotalSuggestions { get; set; }
        public int MediumLevelSuggestions { get; set; }
        public double MediumLevelRate { get; set; } // %
    }

    /// <summary>
    /// Báo cáo tổng thể cải tiến toàn công ty
    /// </summary>
    public class CompanyWideImprovementDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public string MonthName { get; set; } = null!;
        public int TotalSuggestionsCount { get; set; }
        public decimal TotalBenefitUSD { get; set; }
        public int TotalParticipantsCount { get; set; }
        public double LowLevelRate { get; set; } // Cấp thấp
        public double MediumLevelRate { get; set; } // Cấp trung - 中級改善率
        public double HighLevelRate { get; set; } // Cấp cao
        public double ImplementationRate { get; set; } // Tỷ lệ thực hiện
        public double ApprovalRate { get; set; } // Tỷ lệ chấp thuận
    }

    /// <summary>
    /// Bộ lọc để truy vấn dữ liệu cải tiến
    /// </summary>
    public class ImprovementFilterDto
    {
        public long? ProjectId { get; set; }
        public long? DepartmentId { get; set; }
        public long? UserId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; } // Submitted, Approved, Implemented, Rejected
        public int? LevelOfImprovement { get; set; }
        public bool? IncludeRejected { get; set; } = false;
    }
}
