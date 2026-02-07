using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class WorkflowTransition
{
    public long Id { get; set; }
    public long FromStatusId { get; set; }
    public long ToStatusId { get; set; }
    public string Name { get; set; } = null!;
    public virtual WorkflowStatus FromStatus { get; set; } = null!;
    public virtual WorkflowStatus ToStatus { get; set; } = null!;
}