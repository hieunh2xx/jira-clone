namespace ManagementProject.DTO
{
    public class ProjectDTO
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
        public string? CreateedName { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string TeamName {  get; set; }
        public string? DepartmentName { get; set; }
        public bool? IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public bool? RequiresEvaluation { get; set; }
    }
    public class ProjectCreateDTO
    {
        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public string? Description { get; set; }
        public long TeamId { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public List<long>? MemberIds { get; set; }
        public long? DepartmentId { get; set; }
    }
    public class ProjectUpdateDTO
    {
        public long Id { get; set; } 
        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public string? Description { get; set; }
        public long TeamId { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
    }
    public class AddProjectMemberDTO
    {
        public long UserId { get; set; }
    }
}