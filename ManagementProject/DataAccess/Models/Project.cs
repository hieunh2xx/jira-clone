using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class Project
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public long TeamId { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? CreatedAt { get; set; }
    public virtual ICollection<Board> Boards { get; set; } = new List<Board>();
    public virtual User? CreatedByNavigation { get; set; }
    public virtual ICollection<CustomField> CustomFields { get; set; } = new List<CustomField>();
    public virtual ICollection<Epic> Epics { get; set; } = new List<Epic>();
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
    public virtual Team Team { get; set; } = null!;
    public virtual ICollection<WorkflowScheme> WorkflowSchemes { get; set; } = new List<WorkflowScheme>();
    public bool? IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool? RequiresEvaluation { get; set; }
    public virtual ICollection<ProjectEvaluation> ProjectEvaluations { get; set; } = new List<ProjectEvaluation>();
    public virtual ICollection<ProjectImprovement> ProjectImprovements { get; set; } = new List<ProjectImprovement>();
    public virtual ICollection<ProjectTrialEvaluation> ProjectTrialEvaluations { get; set; } = new List<ProjectTrialEvaluation>();
    public virtual ICollection<ProjectImage> ProjectImages { get; set; } = new List<ProjectImage>();
    public virtual ICollection<ProjectProcess> ProjectProcesses { get; set; } = new List<ProjectProcess>();
    public virtual ICollection<UserProjectAssignment> UserProjectAssignments { get; set; } = new List<UserProjectAssignment>();
}