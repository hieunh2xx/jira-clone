using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class ProjectTrialEvaluation
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public long? UserId { get; set; }
    public int OrderIndex { get; set; }
    public string ReductionItem { get; set; } = null!;
    public string? ManHours { get; set; }
    public string? BeforeImprovement { get; set; }
    public string? AfterImprovement { get; set; }
    public string? EstimatedEfficiency { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Project Project { get; set; } = null!;
    public virtual User? User { get; set; }
}
