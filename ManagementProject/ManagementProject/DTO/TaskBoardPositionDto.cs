namespace ManagementProject.DTO
{
    public class TaskBoardPositionDto
    {
        public long TaskId { get; set; }
        public long BoardId { get; set; }
        public long? ColumnId { get; set; }
        public double Position { get; set; }
    }
    public class UpdateTaskPositionRequest
    {
        public long TaskId { get; set; }
        public long BoardId { get; set; }
        public long? TargetColumnId { get; set; }
        public double NewPosition { get; set; }
    }
}