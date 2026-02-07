using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Category
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}