using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Department
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public long? ManagerId { get; set; }
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }
    public virtual User? Manager { get; set; }
    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}