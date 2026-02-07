using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Role
{
    public short Id { get; set; }
    public string Name { get; set; } = null!;
    public byte Level { get; set; }
    public string? Description { get; set; }
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}