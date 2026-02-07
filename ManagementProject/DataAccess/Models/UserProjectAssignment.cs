using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class UserProjectAssignment
{
    public long UserId { get; set; }
    public long ProjectId { get; set; }
    public DateTime? AssignedAt { get; set; }
    public string? Role { get; set; } // Project role: "keymain", "member", etc.
    public virtual Project Project { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
