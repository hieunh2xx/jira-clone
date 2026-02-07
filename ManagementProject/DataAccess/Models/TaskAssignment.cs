using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class TaskAssignment
{
    public long Id { get; set; }
    public long TaskId { get; set; }
    public long UserId { get; set; }
    public long? AssignedBy { get; set; }
    public DateTime? AssignedAt { get; set; }
    public virtual User? AssignedByNavigation { get; set; }
    public virtual Task Task { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}