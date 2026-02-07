using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class SprintTask
{
    public long SprintId { get; set; }
    public long TaskId { get; set; }
    public DateTime? AddedAt { get; set; }
    
    public virtual Sprint? Sprint { get; set; }
    public virtual Task? Task { get; set; }
}