namespace ManagementProject.DTO
{
    public class ProjectEvaluationDTO
    {
        public long Id { get; set; }
        public long ProjectId { get; set; }
        public long UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserFullName { get; set; }
        public int? QualityRating { get; set; }
        public string? QualityComment { get; set; }
        public int? CostRating { get; set; }
        public string? CostComment { get; set; }
        public int? DeliveryRating { get; set; }
        public string? DeliveryComment { get; set; }
        public string? GeneralComment { get; set; }
        public int? DeploymentTime { get; set; }
        public DateTime? EvaluatedAt { get; set; }
    }
    public class ProjectEvaluationCreateDTO
    {
        public long ProjectId { get; set; }
        public int? QualityRating { get; set; }
        public string? QualityComment { get; set; }
        public int? CostRating { get; set; }
        public string? CostComment { get; set; }
        public int? DeliveryRating { get; set; }
        public string? DeliveryComment { get; set; }
        public string? GeneralComment { get; set; }
        public int? DeploymentTime { get; set; }
    }
    public class ProjectImprovementDTO
    {
        public long Id { get; set; }
        public long ProjectId { get; set; }
        public string Type { get; set; } = null!; // "before" or "after"
        public string Category { get; set; } = null!; // "advantage" or "disadvantage"
        public string Content { get; set; } = null!;
        public int? OrderIndex { get; set; }
    }
    public class ProjectImprovementCreateDTO
    {
        public long ProjectId { get; set; }
        public string Type { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string Content { get; set; } = null!;
        public int? OrderIndex { get; set; }
    }
    public class ProjectTrialEvaluationDTO
    {
        public long Id { get; set; }
        public long ProjectId { get; set; }
        public long? UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserFullName { get; set; }
        public int OrderIndex { get; set; }
        public string ReductionItem { get; set; } = null!;
        public string? ManHours { get; set; }
        public string? BeforeImprovement { get; set; }
        public string? AfterImprovement { get; set; }
        public string? EstimatedEfficiency { get; set; }
    }
    public class ProjectTrialEvaluationCreateDTO
    {
        public long ProjectId { get; set; }
        public List<ProjectTrialEvaluationItemDTO> Items { get; set; } = new();
    }
    public class ProjectTrialEvaluationItemDTO
    {
        public int OrderIndex { get; set; }
        public string ReductionItem { get; set; } = null!;
        public string? ManHours { get; set; }
        public string? BeforeImprovement { get; set; }
        public string? AfterImprovement { get; set; }
        public string? EstimatedEfficiency { get; set; }
    }
    public class ProjectImageDTO
    {
        public long Id { get; set; }
        public long ProjectId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public string? FileName { get; set; }
        public long? FileSizeKb { get; set; }
        public string? Description { get; set; }
        public long? UploadedBy { get; set; }
        public string? UploadedByName { get; set; }
        public DateTime? UploadedAt { get; set; }
    }
    public class ProjectImageCreateDTO
    {
        public long ProjectId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public string? FileName { get; set; }
        public long? FileSizeKb { get; set; }
        public string? Description { get; set; }
    }
    public class ProjectImageUploadDTO
    {
        public long ProjectId { get; set; }
        public Microsoft.AspNetCore.Http.IFormFile? Image { get; set; }
        public string? Description { get; set; }
    }
    public class ProjectProcessDTO
    {
        public long Id { get; set; }
        public long ProjectId { get; set; }
        public string? ProcessDescription { get; set; }
        public string? ProcessOverview { get; set; }
    }
    public class ProjectProcessCreateDTO
    {
        public long ProjectId { get; set; }
        public string? ProcessDescription { get; set; }
        public string? ProcessOverview { get; set; }
    }
    public class ProjectCompletionDTO
    {
        public long ProjectId { get; set; }
        public bool IsCompleted { get; set; }
    }
    public class ProjectEvaluationStatusDTO
    {
        public long ProjectId { get; set; }
        public bool RequiresEvaluation { get; set; }
        public bool HasEvaluated { get; set; }
        public int TotalMembers { get; set; }
        public int EvaluatedMembers { get; set; }
        public List<ProjectEvaluationMemberDTO> Members { get; set; } = new();
    }
    public class ProjectEvaluationMemberDTO
    {
        public long UserId { get; set; }
        public string UserName { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public bool HasEvaluated { get; set; }
        public DateTime? EvaluatedAt { get; set; }
    }
}
