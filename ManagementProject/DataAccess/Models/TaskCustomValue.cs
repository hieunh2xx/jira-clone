using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class TaskCustomValue
{
    public long Id { get; set; }
    public long TaskId { get; set; }
    public long CustomFieldId { get; set; }
    public string? Value { get; set; }
    public virtual CustomField CustomField { get; set; } = null!;
    public virtual Task Task { get; set; } = null!;
}