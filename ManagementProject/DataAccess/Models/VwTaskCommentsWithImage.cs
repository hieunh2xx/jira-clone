using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class VwTaskCommentsWithImage
{
    public long CommentId { get; set; }
    public long TaskId { get; set; }
    public long UserId { get; set; }
    public string Username { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? PrimaryImageUrl { get; set; }
    public long? ParentCommentId { get; set; }
    public bool? IsReview { get; set; }
    public byte? Rating { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? AdditionalImagesJson { get; set; }
}