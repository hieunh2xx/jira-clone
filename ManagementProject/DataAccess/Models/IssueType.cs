using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class IssueType
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public bool? IsSubtask { get; set; }
    public virtual ICollection<Board> Boards { get; set; } = new List<Board>();
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}