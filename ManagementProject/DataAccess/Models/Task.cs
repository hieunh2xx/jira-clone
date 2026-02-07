using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Task
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public long? ParentTaskId { get; set; }
    public long IssueTypeId { get; set; }
    public long? EpicId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual User? CreatedByNavigation { get; set; }
    public virtual Epic? Epic { get; set; }
    public virtual ICollection<Task> InverseParentTask { get; set; } = new List<Task>();
    public virtual IssueType IssueType { get; set; } = null!;
    public virtual Task? ParentTask { get; set; }
    public virtual Project Project { get; set; } = null!;
    public virtual ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();
    public virtual ICollection<TaskBoardPosition> TaskBoardPositions { get; set; } = new List<TaskBoardPosition>();
    public virtual ICollection<TaskComment> TaskComments { get; set; } = new List<TaskComment>();
    public virtual ICollection<TaskCustomValue> TaskCustomValues { get; set; } = new List<TaskCustomValue>();
    public virtual ICollection<TaskFile> TaskFiles { get; set; } = new List<TaskFile>();
    public virtual ICollection<TaskHistory> TaskHistories { get; set; } = new List<TaskHistory>();
    public virtual ICollection<TaskImage> TaskImages { get; set; } = new List<TaskImage>();
    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();
    public virtual ICollection<SprintTask> SprintTasks { get; set; } = new List<SprintTask>();
}