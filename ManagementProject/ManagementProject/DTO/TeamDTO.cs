using System;
using System.Collections.Generic;
namespace ManagementProject.DTO
{
    public class TeamDTO
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public long DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public long? LeadId { get; set; }
        public string? LeadName { get; set; }
        public string? Description { get; set; }
        public DateTime? CreatedAt { get; set; }
        public List<long> MemberIds { get; set; } = new List<long>();
        public List<string> MemberNames { get; set; } = new List<string>();
    }
    public class TeamCreateDTO
    {
        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public long DepartmentId { get; set; }
        public long? LeadId { get; set; }
        public string? Description { get; set; }
    }
    public class TeamUpdateDTO
    {
        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public long DepartmentId { get; set; }
        public long? LeadId { get; set; }
        public string? Description { get; set; }
    }
    public class AddTeamMemberDTO
    {
        public long UserId { get; set; }
    }
    public class RemoveTeamMemberDTO
    {
        public long UserId { get; set; }
    }
}