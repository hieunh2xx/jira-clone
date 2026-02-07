using System;
namespace ManagementProject.DTO;
public class NotificationDto
{
    public long Id { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public long? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public long? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public long? CommentId { get; set; }
    public long? EvaluationId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public UserDto? CreatedBy { get; set; }
}

public class NotificationCreateDto
{
    public long UserId { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public long? ProjectId { get; set; }
    public long? TaskId { get; set; }
    public long? CommentId { get; set; }
    public long? EvaluationId { get; set; }
}

public class NotificationUpdateDto
{
    public bool? IsRead { get; set; }
}
