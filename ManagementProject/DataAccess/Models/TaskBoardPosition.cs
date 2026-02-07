using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class TaskBoardPosition
{
    public long TaskId { get; set; }
    public long BoardId { get; set; }
    public long? ColumnId { get; set; }
    public double Position { get; set; }
    public virtual Task Task { get; set; } = null!;
}