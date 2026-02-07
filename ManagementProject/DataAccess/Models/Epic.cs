using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Epic
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public string Name { get; set; } = null!;
    public string? Summary { get; set; }
    public virtual Project Project { get; set; } = null!;
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}