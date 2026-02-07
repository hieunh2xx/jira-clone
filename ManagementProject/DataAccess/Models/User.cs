using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class User
{
    public long Id { get; set; }
    public string EmployeeCode { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public long? DepartmentId { get; set; }
    public string? AvatarUrl { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Department? Department { get; set; }
    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    public virtual ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
    public virtual ICollection<TaskAssignment> TaskAssignmentAssignedByNavigations { get; set; } = new List<TaskAssignment>();
    public virtual ICollection<TaskAssignment> TaskAssignmentUsers { get; set; } = new List<TaskAssignment>();
    public virtual ICollection<TaskCommentImage> TaskCommentImages { get; set; } = new List<TaskCommentImage>();
    public virtual ICollection<TaskCommentFile> TaskCommentFiles { get; set; } = new List<TaskCommentFile>();
    public virtual ICollection<TaskComment> TaskComments { get; set; } = new List<TaskComment>();
    public virtual ICollection<TaskHistory> TaskHistories { get; set; } = new List<TaskHistory>();
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
    public virtual ICollection<UserTeamAssignment> UserTeamAssignments { get; set; } = new List<UserTeamAssignment>();
    public virtual ICollection<UserProjectAssignment> UserProjectAssignments { get; set; } = new List<UserProjectAssignment>();
    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
}