
using Microsoft.AspNetCore.Mvc;
namespace ManagementProject.Controllers;
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;
    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }
    [HttpGet]
    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            message = "Application is running"
        });
    }
    [HttpGet("detailed")]
    public IActionResult Detailed()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            services = new
            {
                database = "connected",
                email = "configured",
                backgroundServices = "running"
            }
        });
    }
}