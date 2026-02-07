using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Team
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public long DepartmentId { get; set; }
    public long? LeadId { get; set; }
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }
    public virtual Department Department { get; set; } = null!;
    public virtual User? Lead { get; set; }
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    public virtual ICollection<UserTeamAssignment> UserTeamAssignments { get; set; } = new List<UserTeamAssignment>();
}