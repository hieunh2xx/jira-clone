
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
namespace ManagementProject.Services;
public class AutoRunBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AutoRunBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30);
    public AutoRunBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<AutoRunBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Auto Run Background Service started at {Time}", DateTime.UtcNow);
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunScheduledTasks(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Auto Run Background Service");
            }
            await Task.Delay(_checkInterval, stoppingToken);
        }
        _logger.LogInformation("Auto Run Background Service stopped");
    }
    private async Task RunScheduledTasks(CancellationToken ct)
    {
        _logger.LogInformation("Running scheduled tasks at {Time}", DateTime.UtcNow);
        using var scope = _serviceProvider.CreateScope();
        try
        {
            await Task.CompletedTask;
            _logger.LogInformation("Scheduled tasks completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running scheduled tasks");
            throw;
        }
    }
    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Auto Run Background Service is stopping");
        await base.StopAsync(cancellationToken);
    }
}