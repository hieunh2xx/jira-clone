using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class ProjectImprovement
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public long? CreatedBy { get; set; }
    public string Type { get; set; } = null!; // "before" or "after"
    public string Category { get; set; } = null!; // "advantage" or "disadvantage"
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string? Status { get; set; } // submitted, approved, implemented, rejected
    public int? Level { get; set; } // 1 = low, 2 = medium, 3 = high
    public decimal? ExpectedBenefit { get; set; }
    public decimal? ActualBenefit { get; set; }
    public int? ParticipantsCount { get; set; }
    public int? OrderIndex { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Project Project { get; set; } = null!;
    public virtual User? CreatedByNavigation { get; set; }
}
