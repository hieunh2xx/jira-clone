using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
namespace ManagementProject.DTO
{
    public class CreateTaskDto
    {
        [Required] public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Status { get; set; } = "todo";
        public string Priority { get; set; } = "medium";
        public DateTime? DueDate { get; set; }
        public decimal? EstimatedHours { get; set; }
        [Required] public long ProjectId { get; set; }
        public long? EpicId { get; set; }
        public long IssueTypeId { get; set; } = 3;
        public long? ParentTaskId { get; set; }
        public List<long> AssigneeIds { get; set; } = new();
        public List<long> CategoryIds { get; set; } = new();
        [Required] public long CreatedBy { get; set; }
        public List<IFormFile>? Images { get; set; }
        public List<IFormFile>? Files { get; set; }
    }
    public class UpdateTaskDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public long? EpicId { get; set; }
        public long? IssueTypeId { get; set; }
        public long? ParentTaskId { get; set; }
        public List<long>? AssigneeIds { get; set; }
        public List<long>? CategoryIds { get; set; }
        public List<IFormFile>? Images { get; set; }
        public List<IFormFile>? Files { get; set; }
    }
    public class UpdateTaskStatusRequest
    {
        [Required]
        [RegularExpression("^(todo|in_progress|review|done|fix)$")]
        public string Status { get; set; } = null!;
    }
    public class TaskDto
    {
        public long Id { get; set; }
        public string Key { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Status { get; set; } = "todo";
        public string StatusName { get; set; } = "Cần làm";
        public string Priority { get; set; } = "medium";
        public DateTime? DueDate { get; set; }
        public bool? IsOverdue { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal ActualHours { get; set; }
        public long ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public long? EpicId { get; set; }
        public string? EpicName { get; set; }
        public long IssueTypeId { get; set; }
        public string IssueTypeName { get; set; } = null!;
        public long? ParentTaskId { get; set; }
        public string? ParentTaskTitle { get; set; }
        public List<long> AssigneeIds { get; set; } = new();
        public List<string> AssigneeNames { get; set; } = new();
        public List<long> CategoryIds { get; set; } = new();
        public List<string> CategoryNames { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public long CreatedBy { get; set; }
        public string CreatedByName { get; set; } = null!;
        public List<TaskImageDto> Images { get; set; } = new();
        public List<TaskFileDto> Files { get; set; } = new();
    }
    public class TaskDetailDto : TaskDto
    {
        public List<TaskCommentDto> Comments { get; set; } = new();
        public Dictionary<string, string> CustomFields { get; set; } = new();
    }
    public class TaskCommentDto
    {
        public long Id { get; set; }
        public string Content { get; set; } = null!;
        public string? PrimaryImageUrl { get; set; }
        public List<TaskCommentImageDto> AdditionalImages { get; set; } = new();
        public List<TaskCommentFileDto> Files { get; set; } = new();
        public long UserId { get; set; }
        public string Username { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public bool IsReview { get; set; }
        public byte? Rating { get; set; }
        public long? ParentCommentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<TaskCommentDto> Replies { get; set; } = new();
    }
    public class TaskCommentImageDto
    {
        public long Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public string? FileName { get; set; }
        public int? FileSizeKb { get; set; }
        public DateTime UploadedAt { get; set; }
    }
    public class TaskCommentFileDto
    {
        public long Id { get; set; }
        public string FileUrl { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public int? FileSizeKb { get; set; }
        public DateTime UploadedAt { get; set; }
    }
    public class TaskImageDto
    {
        public long Id { get; set; }
        public string FileName { get; set; } = null!;
        public string ImageUrl { get; set; } = null!;
        public int FileSizeKb { get; set; }
        public DateTime UploadedAt { get; set; }
    }
    public class TaskFileDto
    {
        public long Id { get; set; }
        public string FileName { get; set; } = null!;
        public string FileUrl { get; set; } = null!;
        public int FileSizeKb { get; set; }
        public DateTime UploadedAt { get; set; }
    }
    public class KanbanBoardDto
    {
        public List<KanbanColumnDto> Columns { get; set; } = new();
    }
    public class KanbanColumnDto
    {
        public string Status { get; set; } = null!;
        public string Color { get; set; } = "#DFE1E6";
        public List<TaskDto> Tasks { get; set; } = new();
    }
}