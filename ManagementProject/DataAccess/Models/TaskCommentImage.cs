using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class TaskCommentImage
{
    public long Id { get; set; }
    public long CommentId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public string? FileName { get; set; }
    public int? FileSizeKb { get; set; }
    public DateTime? UploadedAt { get; set; }
    public long? UploadedBy { get; set; }
    public virtual TaskComment Comment { get; set; } = null!;
    public virtual User? UploadedByNavigation { get; set; }
}