namespace ManagementProject.DTO
{
    public class WorkflowStatusDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public bool IsInitial { get; set; }
    }
    public class ChangeTaskStatusRequest
    {
        public long TaskId { get; set; }
        public long NewStatusId { get; set; }
        public long UserId { get; set; }
    }
}