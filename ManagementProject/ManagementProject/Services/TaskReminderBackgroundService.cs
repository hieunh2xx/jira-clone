
using DataAccess.Models;
using Microsoft.EntityFrameworkCore;
namespace ManagementProject.Services;
public class TaskReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TaskReminderBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);
    private DateTime? _lastDailyEmailDate = null;
    private readonly object _lockObject = new object();
    
    public TaskReminderBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<TaskReminderBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }
    protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Task Reminder Background Service started");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndSendReminders(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Task Reminder Background Service");
            }
            await System.Threading.Tasks.Task.Delay(_checkInterval, stoppingToken);
        }
    }
    private async System.Threading.Tasks.Task CheckAndSendReminders(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<ProjectManagementDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var now = DateTime.UtcNow;
        var today = now.Date;
        var tomorrow = today.AddDays(1);
        
        // Gửi email nhắc nhở cho task sắp đến hạn (ngày mai)
        var tasksDueTomorrow = await ctx.Tasks
            .Include(t => t.TaskAssignments)
                .ThenInclude(ta => ta.User)
            .Where(t => t.DueDate != null 
                && t.DueDate.Value.Date == tomorrow
                && t.Status != "done")
            .ToListAsync(ct);
        _logger.LogInformation("Found {Count} tasks due tomorrow", tasksDueTomorrow.Count);
        foreach (var task in tasksDueTomorrow)
        {
            try
            {
                await emailService.SendTaskDueDateReminderEmailAsync(task.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reminder for task {TaskId}", task.Id);
            }
        }
        
        // Gửi email hàng ngày cho tất cả task quá hạn (chỉ gửi 1 lần mỗi ngày)
        lock (_lockObject)
        {
            if (_lastDailyEmailDate == null || _lastDailyEmailDate.Value.Date < today)
            {
                _logger.LogInformation("Triggering daily overdue tasks email. Last sent: {LastDate}, Today: {Today}", 
                    _lastDailyEmailDate?.ToString("yyyy-MM-dd") ?? "Never", today.ToString("yyyy-MM-dd"));
                
                // Gửi email bất đồng bộ nhưng không chờ đợi để không block service
                _ = System.Threading.Tasks.Task.Run(async () =>
                {
                    try
                    {
                        await emailService.SendOverdueTasksDailyEmailAsync();
                        lock (_lockObject)
                        {
                            _lastDailyEmailDate = today;
                        }
                        _logger.LogInformation("Daily overdue tasks email sent successfully");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send daily overdue tasks email");
                    }
                }, ct);
            }
            else
            {
                _logger.LogDebug("Daily overdue tasks email already sent today. Last sent: {LastDate}", 
                    _lastDailyEmailDate.Value.ToString("yyyy-MM-dd"));
            }
        }
    }
}