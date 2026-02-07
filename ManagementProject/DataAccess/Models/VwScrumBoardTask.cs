using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class VwScrumBoardTask
{
    public long TaskId { get; set; }
    public long ProjectId { get; set; }
    public string Title { get; set; } = null!;
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }
    public string? ProjectCode { get; set; }
    public long BoardId { get; set; }
    public string BoardName { get; set; } = null!;
    public long? ColumnId { get; set; }
    public string? ColumnName { get; set; }
    public int? ColumnPosition { get; set; }
    public double? TaskPosition { get; set; }
    public long? SprintId { get; set; }
    public string? SprintName { get; set; }
    public string? SprintStatus { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? AssigneeUsername { get; set; }
    public string? AssigneeName { get; set; }
    public string? CreatorUsername { get; set; }
}