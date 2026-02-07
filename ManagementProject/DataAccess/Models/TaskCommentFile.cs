using System;
namespace DataAccess.Models;
public partial class TaskCommentFile
{
    public long Id { get; set; }
    public long CommentId { get; set; }
    public string FileUrl { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public int? FileSizeKb { get; set; }
    public DateTime? UploadedAt { get; set; }
    public long? UploadedBy { get; set; }
    public virtual TaskComment Comment { get; set; } = null!;
    public virtual User? UploadedByNavigation { get; set; }
}