namespace ManagementProject.DTO;
public class LoginResponseDto
{
    public int Code { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public UserDto? User { get; set; }
}