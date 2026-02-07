using System.ComponentModel.DataAnnotations;
namespace ManagementProject.DTO
{
    public class CreateCommentRequest
    {
        [Required] public string Content { get; set; } = null!;
        public long? ParentCommentId { get; set; }
        public bool IsReview { get; set; } = false;
        public byte? Rating { get; set; }
        [Required] public long UserId { get; set; }
    }
    public class UpdateCommentRequest
    {
        public string? Content { get; set; }
        public bool? IsReview { get; set; }
        public byte? Rating { get; set; }
    }
    public class CommentDto
    {
        public long Id { get; set; }
        public string Content { get; set; } = null!;
        public string? PrimaryImageUrl { get; set; }
        public List<CommentImageDto> AdditionalImages { get; set; } = new();
        public List<CommentFileDto> Files { get; set; } = new();
        public long UserId { get; set; }
        public string Username { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public bool IsReview { get; set; }
        public byte? Rating { get; set; }
        public long? ParentCommentId { get; set; }
        public long TaskId { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<CommentDto> Replies { get; set; } = new();
    }
    public class CommentImageDto
    {
        public long Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public string? FileName { get; set; }
        public int? FileSizeKb { get; set; }
        public DateTime UploadedAt { get; set; }
    }
    public class CommentFileDto
    {
        public long Id { get; set; }
        public string FileUrl { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public int? FileSizeKb { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}