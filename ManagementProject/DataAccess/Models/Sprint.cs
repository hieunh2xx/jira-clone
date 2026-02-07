using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Sprint
{
    public long Id { get; set; }
    public long BoardId { get; set; }
    public string Name { get; set; } = null!;
    public string? Goal { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? CompletedDate { get; set; }
    public DateTime? CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public virtual Board Board { get; set; } = null!;
    public virtual User? CreatedByNavigation { get; set; }
    public virtual ICollection<SprintTask> SprintTasks { get; set; } = new List<SprintTask>();
}