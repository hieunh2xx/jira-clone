using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class TaskFile
{
    public long Id { get; set; }
    public long TaskId { get; set; }
    public string FileName { get; set; } = null!;
    public string FileUrl { get; set; } = null!;
    public int FileSizeKb { get; set; }
    public DateTime UploadedAt { get; set; }
    public virtual Task Task { get; set; } = null!;
}