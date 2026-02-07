using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class UserTeamAssignment
{
    public long UserId { get; set; }
    public long TeamId { get; set; }
    public DateTime? AssignedAt { get; set; }
    public virtual Team Team { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}