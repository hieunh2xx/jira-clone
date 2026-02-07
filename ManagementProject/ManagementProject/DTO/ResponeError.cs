namespace ManagementProject.DTO;
public class ResponeError<T>
{
    public int Code { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
}