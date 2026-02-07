using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class WorkflowStatus
{
    public long Id { get; set; }
    public long WorkflowSchemeId { get; set; }
    public string Name { get; set; } = null!;
    public string? Color { get; set; }
    public bool? IsInitial { get; set; }
    public virtual ICollection<BoardColumn> BoardColumns { get; set; } = new List<BoardColumn>();
    public virtual WorkflowScheme WorkflowScheme { get; set; } = null!;
    public virtual ICollection<WorkflowTransition> WorkflowTransitionFromStatuses { get; set; } = new List<WorkflowTransition>();
    public virtual ICollection<WorkflowTransition> WorkflowTransitionToStatuses { get; set; } = new List<WorkflowTransition>();
}