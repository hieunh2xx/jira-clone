using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class ProjectProcess
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public long? UserId { get; set; }
    public string? ProcessDescription { get; set; }
    public string? ProcessOverview { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Project Project { get; set; } = null!;
    public virtual User? User { get; set; }
}
