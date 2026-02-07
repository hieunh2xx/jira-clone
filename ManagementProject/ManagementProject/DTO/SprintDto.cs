namespace ManagementProject.DTO
{
    public class SprintDto
    {
        public long Id { get; set; }
        public long BoardId { get; set; }
        public string Name { get; set; }
        public string Goal { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime? CreatedAt { get; set; }
        public long? CreatedBy { get; set; }
        public string CreatorUsername { get; set; }
    }
    public class CreateSprintRequest
    {
        public long BoardId { get; set; }
        public string Name { get; set; }
        public string Goal { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public long CreatedBy { get; set; }
    }
    public class AddTasksToSprintRequest
    {
        public long SprintId { get; set; }
        public List<long> TaskIds { get; set; } = new();
    }
}