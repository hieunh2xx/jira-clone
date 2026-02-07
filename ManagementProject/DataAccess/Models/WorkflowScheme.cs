using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class WorkflowScheme
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public long? ProjectId { get; set; }
    public string? Description { get; set; }
    public virtual Project? Project { get; set; }
    public virtual ICollection<WorkflowStatus> WorkflowStatuses { get; set; } = new List<WorkflowStatus>();
}