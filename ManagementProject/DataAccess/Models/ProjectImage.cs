using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class ProjectImage
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public string? FileName { get; set; }
    public long? FileSizeKb { get; set; }
    public string? Description { get; set; }
    public long? UploadedBy { get; set; }
    public DateTime? UploadedAt { get; set; }
    public virtual Project Project { get; set; } = null!;
    public virtual User? UploadedByNavigation { get; set; }
}
