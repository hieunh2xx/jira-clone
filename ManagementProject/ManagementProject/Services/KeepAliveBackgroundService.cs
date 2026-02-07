
namespace ManagementProject.Services;
public class KeepAliveBackgroundService : BackgroundService
{
    private readonly ILogger<KeepAliveBackgroundService> _logger;
    private readonly TimeSpan _heartbeatInterval = TimeSpan.FromMinutes(5);
    public KeepAliveBackgroundService(ILogger<KeepAliveBackgroundService> logger)
    {
        _logger = logger;
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Keep-Alive Background Service started at {Time}", DateTime.UtcNow);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogDebug("Keep-Alive Background Service heartbeat at {Time}", DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Keep-Alive Background Service");
            }
            await Task.Delay(_heartbeatInterval, stoppingToken);
        }
        _logger.LogInformation("Keep-Alive Background Service stopped");
    }
}