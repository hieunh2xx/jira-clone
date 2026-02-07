using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Board
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
    public long ProjectId { get; set; }
    public bool? IsActive { get; set; }
    public long? DefaultIssueTypeId { get; set; }
    public string? QuickFiltersJson { get; set; }
    public virtual ICollection<BoardColumn> BoardColumns { get; set; } = new List<BoardColumn>();
    public virtual IssueType? DefaultIssueType { get; set; }
    public virtual Project Project { get; set; } = null!;
    public virtual ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
}