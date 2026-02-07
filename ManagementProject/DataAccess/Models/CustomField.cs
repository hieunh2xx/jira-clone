using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class CustomField
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
    public long? ProjectId { get; set; }
    public virtual Project? Project { get; set; }
    public virtual ICollection<TaskCustomValue> TaskCustomValues { get; set; } = new List<TaskCustomValue>();
}