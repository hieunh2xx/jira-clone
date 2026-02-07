using System;
namespace DataAccess.Models;
public partial class Notification
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Type { get; set; } = null!; // "project_change", "task_comment", "project_evaluation"
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public long? ProjectId { get; set; }
    public long? TaskId { get; set; }
    public long? CommentId { get; set; }
    public long? EvaluationId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public virtual User User { get; set; } = null!;
    public virtual Project? Project { get; set; }
    public virtual Task? Task { get; set; }
}
