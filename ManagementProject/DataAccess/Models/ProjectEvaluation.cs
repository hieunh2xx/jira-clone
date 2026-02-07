using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class ProjectEvaluation
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public long UserId { get; set; }
    public int? QualityRating { get; set; }
    public string? QualityComment { get; set; }
    public int? CostRating { get; set; }
    public string? CostComment { get; set; }
    public int? DeliveryRating { get; set; }
    public string? DeliveryComment { get; set; }
    public string? GeneralComment { get; set; }
    public int? DeploymentTime { get; set; }
    public DateTime? EvaluatedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Project Project { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
