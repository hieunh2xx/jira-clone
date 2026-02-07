using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class TaskHistory
{
    public long Id { get; set; }
    public long TaskId { get; set; }
    public long UserId { get; set; }
    public string FieldName { get; set; } = null!;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime? ChangedAt { get; set; }
    public virtual Task Task { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}