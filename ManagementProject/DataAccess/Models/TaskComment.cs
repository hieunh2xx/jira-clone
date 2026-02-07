using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class TaskComment
{
    public long Id { get; set; }
    public long TaskId { get; set; }
    public long UserId { get; set; }
    public long? ParentCommentId { get; set; }
    public string Content { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public bool? IsReview { get; set; }
    public byte? Rating { get; set; }
    public DateTime? CreatedAt { get; set; }
    public virtual ICollection<TaskComment> InverseParentComment { get; set; } = new List<TaskComment>();
    public virtual TaskComment? ParentComment { get; set; }
    public virtual Task Task { get; set; } = null!;
    public virtual ICollection<TaskCommentImage> TaskCommentImages { get; set; } = new List<TaskCommentImage>();
    public virtual User User { get; set; } = null!;
    public virtual ICollection<TaskCommentFile> TaskCommentFiles { get; internal set; }
}