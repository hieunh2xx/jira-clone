using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class BoardColumn
{
    public long Id { get; set; }
    public long BoardId { get; set; }
    public long? WorkflowStatusId { get; set; }
    public string Name { get; set; } = null!;
    public int Position { get; set; }
    public int? WipLimit { get; set; }
    public bool? IsHidden { get; set; }
    public virtual Board Board { get; set; } = null!;
    public virtual WorkflowStatus? WorkflowStatus { get; set; }
}