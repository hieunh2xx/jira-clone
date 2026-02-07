namespace ManagementProject.DTO
{
    public class BoardDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public long ProjectId { get; set; }
        public List<BoardColumnDto> Columns { get; set; } = new();
    }
    public class BoardColumnDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public int Position { get; set; }
        public int? WipLimit { get; set; }
        public long? WorkflowStatusId { get; set; }
        public bool IsHidden { get; set; }
    }
}