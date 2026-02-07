
using DataAccess.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Azure.Identity;
using System.Net;
using System.Net.Mail;
namespace ManagementProject.Services;
public class MicrosoftGraphSettings
{
    public string TenantId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string FromName { get; set; } = "ProjectHub";
}
public class SmtpSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public bool EnableSsl { get; set; } = true;
    public string FromEmail { get; set; } = "";
    public string FromName { get; set; } = "ProjectHub";
}
public class EmailSettings
{
    public string Provider { get; set; } = "MicrosoftGraph";
    public MicrosoftGraphSettings MicrosoftGraph { get; set; } = new();
    public SmtpSettings Smtp { get; set; } = new();
    public bool IsEnabled { get; set; } = true;
    public string FrontendUrl { get; set; } = "http://localhost:5173";
}
public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ProjectManagementDbContext _ctx;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailService> _logger;
    private GraphServiceClient? _graphClient;
    public EmailService(
        IOptions<EmailSettings> settings,
        ProjectManagementDbContext ctx,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _ctx = ctx;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _logger.LogInformation("EmailService initialized with Provider: {Provider}, IsEnabled: {IsEnabled}", 
            _settings.Provider, _settings.IsEnabled);
        if (_settings.Provider == "MicrosoftGraph" && _settings.IsEnabled)
        {
            _logger.LogInformation("Initializing Microsoft Graph client...");
            InitializeGraphClient();
        }
        else
        {
            _logger.LogWarning("Email provider is not MicrosoftGraph: {Provider}. Only MicrosoftGraph is supported.", 
                _settings.Provider);
        }
    }
    private void InitializeGraphClient()
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_settings.MicrosoftGraph.TenantId))
            {
                _logger.LogError("Microsoft Graph TenantId is not configured");
                _graphClient = null;
                return;
            }
            if (string.IsNullOrWhiteSpace(_settings.MicrosoftGraph.ClientId))
            {
                _logger.LogError("Microsoft Graph ClientId is not configured");
                _graphClient = null;
                return;
            }
            if (string.IsNullOrWhiteSpace(_settings.MicrosoftGraph.ClientSecret))
            {
                _logger.LogError("Microsoft Graph ClientSecret is not configured");
                _graphClient = null;
                return;
            }
            if (string.IsNullOrWhiteSpace(_settings.MicrosoftGraph.FromEmail))
            {
                _logger.LogError("Microsoft Graph FromEmail is not configured");
                _graphClient = null;
                return;
            }
            
            var clientSecretCredential = new ClientSecretCredential(
                _settings.MicrosoftGraph.TenantId,
                _settings.MicrosoftGraph.ClientId,
                _settings.MicrosoftGraph.ClientSecret);
            _graphClient = new GraphServiceClient(clientSecretCredential);
            _logger.LogInformation("Microsoft Graph client initialized successfully. FromEmail: {FromEmail}, TenantId: {TenantId}", 
                _settings.MicrosoftGraph.FromEmail, _settings.MicrosoftGraph.TenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Microsoft Graph client. TenantId: {TenantId}, ClientId: {ClientId}", 
                _settings.MicrosoftGraph.TenantId, _settings.MicrosoftGraph.ClientId);
            _graphClient = null;
        }
    }
    public async System.Threading.Tasks.Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        if (!_settings.IsEnabled)
        {
            _logger.LogInformation("Email is disabled. Would send to {To}: {Subject}", to, subject);
            return;
        }
        if (string.IsNullOrWhiteSpace(to))
        {
            _logger.LogWarning("Email recipient is empty. Subject: {Subject}", subject);
            return;
        }
        _logger.LogInformation("Email provider configured: {Provider}", _settings.Provider);
        if (_settings.Provider != "MicrosoftGraph")
        {
            _logger.LogError("Invalid email provider: {Provider}. Only MicrosoftGraph is supported. Email will not be sent: {Subject}", 
                _settings.Provider, subject);
            return;
        }
        _logger.LogInformation("Using Microsoft Graph provider to send email: {Subject}", subject);
            await SendEmailViaMicrosoftGraphAsync(to, subject, body, isHtml);
    }
    private async System.Threading.Tasks.Task SendEmailViaSmtpAsync(string to, string subject, string body, bool isHtml)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_settings.Smtp.Host))
            {
                _logger.LogError("SMTP Host is not configured. Cannot send email via SMTP fallback to {To}: {Subject}", to, subject);
                return;
            }
            
            if (string.IsNullOrWhiteSpace(_settings.Smtp.FromEmail))
            {
                _logger.LogError("SMTP FromEmail is not configured. Cannot send email via SMTP fallback to {To}: {Subject}", to, subject);
                return;
            }
            
            // Kiểm tra credentials
            if (string.IsNullOrWhiteSpace(_settings.Smtp.Username))
            {
                _logger.LogError("SMTP Username is not configured. Cannot send email via SMTP fallback to {To}: {Subject}. " +
                    "Please configure Smtp:Username in appsettings.json", to, subject);
                return;
            }
            
            if (string.IsNullOrWhiteSpace(_settings.Smtp.Password))
            {
                _logger.LogError("SMTP Password is not configured. Cannot send email via SMTP fallback to {To}: {Subject}. " +
                    "Please configure Smtp:Password in appsettings.json. " +
                    "For Office 365, you may need to use an App Password instead of regular password.", to, subject);
                return;
            }
            
            var recipients = to
                .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .ToList();
            
            if (recipients.Count == 0)
            {
                _logger.LogWarning("No valid email recipients for SMTP fallback. Subject: {Subject}", subject);
                return;
            }
            
            _logger.LogInformation("Attempting to send email via SMTP from {FromEmail} to {To}: {Subject} (Host: {Host}, Port: {Port})", 
                _settings.Smtp.FromEmail, to, subject, _settings.Smtp.Host, _settings.Smtp.Port);
            
            using var smtpClient = new SmtpClient(_settings.Smtp.Host, _settings.Smtp.Port)
            {
                EnableSsl = _settings.Smtp.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_settings.Smtp.Username, _settings.Smtp.Password),
                Timeout = 30000 // 30 seconds timeout
            };
            
            using var mailMessage = new MailMessage
            {
                From = new MailAddress(_settings.Smtp.FromEmail, _settings.Smtp.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };
            
            foreach (var recipient in recipients)
            {
                mailMessage.To.Add(recipient);
            }
            
            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully via SMTP from {FromEmail} to {To}: {Subject}", 
                _settings.Smtp.FromEmail, to, subject);
        }
        catch (SmtpException smtpEx)
        {
            var errorDetails = smtpEx.StatusCode switch
            {
                SmtpStatusCode.GeneralFailure => "General SMTP failure. Check network connection and SMTP server settings.",
                SmtpStatusCode.MustIssueStartTlsFirst => "SMTP server requires TLS/SSL. Try setting EnableSsl to true.",
                SmtpStatusCode.ClientNotPermitted => "Client not permitted to send mail. Check SMTP server permissions.",
                _ => smtpEx.Message.Contains("authentication", StringComparison.OrdinalIgnoreCase) 
                    ? "SMTP authentication failed. Please verify Username and Password in appsettings.json. For Office 365, you may need to use an App Password (not regular password)."
                    : $"SMTP error: {smtpEx.StatusCode}"
            };
            
            _logger.LogError(smtpEx, 
                "Failed to send email via SMTP fallback to {To}: {Subject}. " +
                "Status: {StatusCode}, Details: {Details}, Host: {Host}, Port: {Port}, Username: {Username}", 
                to, subject, smtpEx.StatusCode, errorDetails, _settings.Smtp.Host, _settings.Smtp.Port, _settings.Smtp.Username);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Failed to send email via SMTP fallback to {To}: {Subject}. Error: {Error}. " +
                "Host: {Host}, Port: {Port}, Username configured: {HasUsername}, Password configured: {HasPassword}", 
                to, subject, ex.Message, _settings.Smtp.Host, _settings.Smtp.Port, 
                !string.IsNullOrWhiteSpace(_settings.Smtp.Username), 
                !string.IsNullOrWhiteSpace(_settings.Smtp.Password));
        }
    }
    private async System.Threading.Tasks.Task SendEmailViaMicrosoftGraphAsync(string to, string subject, string body, bool isHtml)
    {
        if (_graphClient == null)
        {
            _logger.LogError("Microsoft Graph client is not initialized. Cannot send email: {Subject}. " +
                "Check Microsoft Graph configuration: TenantId={TenantId}, ClientId={ClientId}, ClientSecret configured={HasSecret}", 
                subject, _settings.MicrosoftGraph.TenantId, _settings.MicrosoftGraph.ClientId, 
                !string.IsNullOrWhiteSpace(_settings.MicrosoftGraph.ClientSecret));
            return;
        }
        try
        {
            var recipients = to
                .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .ToList();
            if (recipients.Count == 0)
            {
                _logger.LogWarning("No valid email recipients for subject: {Subject}", subject);
                return;
            }
            var fromEmail = _settings.MicrosoftGraph.FromEmail;
            if (string.IsNullOrWhiteSpace(fromEmail))
            {
                _logger.LogError("FromEmail is not configured for Microsoft Graph");
                return;
            }
            _logger.LogInformation("Attempting to send email via Microsoft Graph from {FromEmail} to {To}: {Subject}", 
                fromEmail, to, subject);
            var message = new Message
            {
                Subject = subject,
                Body = new ItemBody
                {
                    ContentType = isHtml ? BodyType.Html : BodyType.Text,
                    Content = body
                },
                ToRecipients = recipients.Select(email => new Recipient
                {
                    EmailAddress = new EmailAddress
                    {
                        Address = email
                    }
                }).ToList()
            };
            var requestBody = new Microsoft.Graph.Users.Item.SendMail.SendMailPostRequestBody
            {
                Message = message,
                SaveToSentItems = true
            };
            _logger.LogDebug("Sending email via Microsoft Graph API for user: {FromEmail}", fromEmail);
            
            // Try to get user by email first, then try by ID if needed
            try
            {
                // First attempt: use email directly
                await _graphClient.Users[fromEmail].SendMail.PostAsync(requestBody);
                _logger.LogInformation("Email sent successfully via Microsoft Graph from {FromEmail} to {To}: {Subject}", 
                    fromEmail, to, subject);
            }
            catch (Microsoft.Graph.ServiceException ex)
            {
                // Check if this is a mailbox-related error
                var isMailboxError = ex.Message.Contains("inactive", StringComparison.OrdinalIgnoreCase) || 
                                    ex.Message.Contains("soft-deleted", StringComparison.OrdinalIgnoreCase) ||
                                    ex.Message.Contains("on-premise", StringComparison.OrdinalIgnoreCase) ||
                                    ex.Message.Contains("Request_ResourceNotFound", StringComparison.OrdinalIgnoreCase) ||
                                    ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound ||
                                    ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.BadRequest;
                
                if (isMailboxError)
                {
                    // If user not found by email, try to find user by email and use their ID
                    _logger.LogWarning("Mailbox error detected for '{FromEmail}': {Error}. Attempting to find user by ID", 
                        fromEmail, ex.Message);
                    
                    try
                    {
                        // Try to find user by mail or userPrincipalName
                        var user = await _graphClient.Users
                            .GetAsync(requestConfiguration => 
                            {
                                requestConfiguration.QueryParameters.Filter = $"mail eq '{fromEmail}' or userPrincipalName eq '{fromEmail}'";
                            });
                        
                        if (user?.Value?.FirstOrDefault() != null)
                        {
                            var userId = user.Value.First().Id;
                            _logger.LogInformation("Found user by email, using User ID: {UserId}", userId);
                            
                            // Try sending with user ID
                            await _graphClient.Users[userId].SendMail.PostAsync(requestBody);
                            _logger.LogInformation("Email sent successfully via Microsoft Graph from {FromEmail} (User ID: {UserId}) to {To}: {Subject}", 
                                fromEmail, userId, to, subject);
                            return; // Success, exit method
                        }
                        else
                        {
                            _logger.LogError("User with email '{FromEmail}' not found in Azure AD. " +
                                "Please verify: 1) User exists in Azure AD, 2) Mailbox is cloud-native (not on-premise), 3) Mailbox is active", 
                                fromEmail);
                            throw; // Re-throw original exception
                        }
                    }
                    catch (Exception findEx) when (!(findEx is Microsoft.Graph.ServiceException))
                    {
                        _logger.LogError(findEx, "Failed to find user by email '{FromEmail}' in Azure AD", fromEmail);
                        throw; // Re-throw original exception
                    }
                }
                else
                {
                    // Not a mailbox error, re-throw
                    throw;
                }
            }
        }
        catch (Microsoft.Graph.ServiceException graphEx)
        {
            var errorMessage = graphEx.Message;
            
            _logger.LogError(graphEx, 
                "Microsoft Graph API error when sending email to {To}: {Subject}. " +
                "Status: {StatusCode}, Message: {Message}. " +
                "FromEmail: {FromEmail}, TenantId: {TenantId}, ClientId: {ClientId}", 
                to, subject, graphEx.ResponseStatusCode, errorMessage,
                _settings.MicrosoftGraph.FromEmail, _settings.MicrosoftGraph.TenantId, _settings.MicrosoftGraph.ClientId);
            
            if (graphEx.ResponseHeaders != null)
            {
                _logger.LogDebug("Response headers: {Headers}", 
                    string.Join(", ", graphEx.ResponseHeaders.Select(h => $"{h.Key}={string.Join(",", h.Value)}")));
            }
            
            // Log inner exception if available
            if (graphEx.InnerException != null)
            {
                _logger.LogDebug("Inner exception: {InnerException}", graphEx.InnerException.Message);
            }
            
            // Provide helpful error message based on error message
            if (errorMessage.Contains("inactive", StringComparison.OrdinalIgnoreCase) || 
                errorMessage.Contains("soft-deleted", StringComparison.OrdinalIgnoreCase) || 
                errorMessage.Contains("on-premise", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogError(
                    "❌ MAILBOX ERROR DETECTED for '{FromEmail}'. " +
                    "The mailbox is either inactive, soft-deleted, or hosted on-premise. " +
                    "\n" +
                    "SOLUTIONS:\n" +
                    "1. Check Azure AD Portal → Users → Find '{FromEmail}' → Verify status is 'Active'\n" +
                    "2. If mailbox is on-premise: Ensure Azure AD Connect syncs mailbox properly, OR use a cloud-native mailbox\n" +
                    "3. Verify App Registration has 'Mail.Send' Application permission (not Delegated)\n" +
                    "4. For on-premise mailboxes: Consider using SMTP instead of Microsoft Graph\n" +
                    "5. Try using a different cloud-native mailbox as FromEmail\n" +
                    "\n" +
                    "Current configuration: TenantId={TenantId}, ClientId={ClientId}",
                    _settings.MicrosoftGraph.FromEmail, 
                    _settings.MicrosoftGraph.TenantId, 
                    _settings.MicrosoftGraph.ClientId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Unexpected error when sending email via Microsoft Graph to {To}: {Subject}. Error: {Error}", 
                to, subject, ex.Message);
        }
    }
    public async System.Threading.Tasks.Task SendTaskStatusChangedEmailAsync(long taskId, string oldStatus, string newStatus, long changedByUserId)
    {
        try
        {
            var task = await _ctx.Tasks
                .Include(t => t.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Lead)
                .Include(t => t.Project)
                    .ThenInclude(p => p.CreatedByNavigation)
                .Include(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
                .Include(t => t.CreatedByNavigation)
                .FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null) return;
            var changedByUser = await _ctx.Users.FindAsync(changedByUserId);
            var changedByName = changedByUser != null 
                ? $"{changedByUser.FirstName} {changedByUser.LastName}".Trim() 
                : "Hệ thống";
            var recipients = new HashSet<string>();
            if (task.Project?.Team?.Lead?.Email != null)
            {
                recipients.Add(task.Project.Team.Lead.Email);
            }
            if (task.Project?.CreatedByNavigation?.Email != null)
            {
                recipients.Add(task.Project.CreatedByNavigation.Email);
            }
            if (task.CreatedByNavigation?.Email != null)
            {
                recipients.Add(task.CreatedByNavigation.Email);
            }
            foreach (var assignment in task.TaskAssignments)
            {
                if (assignment.User?.Email != null)
                {
                    recipients.Add(assignment.User.Email);
                }
            }
            if (changedByUser?.Email != null)
            {
                recipients.Remove(changedByUser.Email);
            }
            if (!recipients.Any()) return;
            var subject = $"[{task.Project?.Code ?? "PROJECT"}] Task #{taskId} - Trạng thái đã thay đổi: {GetStatusDisplayName(oldStatus)} → {GetStatusDisplayName(newStatus)}";
            var body = GenerateStatusChangeEmailBody(task, oldStatus, newStatus, changedByName);
            foreach (var email in recipients)
            {
                await SendEmailAsync(email, subject, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send task status changed email for task {TaskId}", taskId);
        }
    }
    public async System.Threading.Tasks.Task SendTaskAssignedEmailAsync(long taskId, List<long> assigneeIds, long assignedByUserId)
    {
        try
        {
            var task = await _ctx.Tasks
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null) return;
            var assignedByUser = await _ctx.Users.FindAsync(assignedByUserId);
            var assignedByName = assignedByUser != null 
                ? $"{assignedByUser.FirstName} {assignedByUser.LastName}".Trim() 
                : "Hệ thống";
            var assignees = await _ctx.Users
                .Where(u => assigneeIds.Contains(u.Id))
                .ToListAsync();
            foreach (var assignee in assignees)
            {
                if (string.IsNullOrEmpty(assignee.Email)) continue;
                var subject = $"[{task.Project?.Code ?? "PROJECT"}] Bạn được giao task mới: {task.Title}";
                var body = GenerateTaskAssignedEmailBody(task, assignee, assignedByName);
                await SendEmailAsync(assignee.Email, subject, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send task assigned email for task {TaskId}", taskId);
        }
    }
    public async System.Threading.Tasks.Task SendTaskCommentEmailAsync(long taskId, long commentId, long commentByUserId)
    {
        try
        {
            var task = await _ctx.Tasks
                .Include(t => t.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Lead)
                .Include(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
                .Include(t => t.CreatedByNavigation)
                .FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null) return;
            var comment = await _ctx.TaskComments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == commentId);
            if (comment == null) return;
            var commentByName = comment.User != null 
                ? $"{comment.User.FirstName} {comment.User.LastName}".Trim() 
                : "Người dùng";
            var recipients = new HashSet<string>();
            if (task.CreatedByNavigation?.Email != null)
                recipients.Add(task.CreatedByNavigation.Email);
            foreach (var assignment in task.TaskAssignments)
            {
                if (assignment.User?.Email != null)
                    recipients.Add(assignment.User.Email);
            }
            if (task.Project?.Team?.Lead?.Email != null)
                recipients.Add(task.Project.Team.Lead.Email);
            if (comment.User?.Email != null)
                recipients.Remove(comment.User.Email);
            if (!recipients.Any()) return;
            var subject = $"[{task.Project?.Code ?? "PROJECT"}] Bình luận mới trên task: {task.Title}";
            var body = GenerateCommentEmailBody(task, comment, commentByName);
            foreach (var email in recipients)
            {
                await SendEmailAsync(email, subject, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send comment email for task {TaskId}", taskId);
        }
    }
    public async System.Threading.Tasks.Task SendTaskDueDateReminderEmailAsync(long taskId)
    {
        try
        {
            var task = await _ctx.Tasks
                .Include(t => t.Project)
                .Include(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
                .FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null || task.DueDate == null) return;
            foreach (var assignment in task.TaskAssignments)
            {
                if (string.IsNullOrEmpty(assignment.User?.Email)) continue;
                var subject = $"[{task.Project?.Code ?? "PROJECT"}] Nhắc nhở: Task \"{task.Title}\" sắp đến hạn";
                var body = GenerateDueDateReminderEmailBody(task, assignment.User);
                await SendEmailAsync(assignment.User.Email, subject, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send due date reminder email for task {TaskId}", taskId);
        }
    }
    public async System.Threading.Tasks.Task SendTaskUpdatedEmailAsync(long taskId, long updatedByUserId)
    {
        try
        {
            var task = await _ctx.Tasks
                .Include(t => t.Project)
                    .ThenInclude(p => p.CreatedByNavigation)
                .Include(t => t.Project)
                    .ThenInclude(p => p.Team)
                        .ThenInclude(t => t.Lead)
                .FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null) return;
            
            // Get the user who updated the task
            var updatedByUser = await _ctx.Users.FindAsync(updatedByUserId);
            if (updatedByUser == null) return;
            
            var updatedByName = $"{updatedByUser.FirstName} {updatedByUser.LastName}".Trim();
            if (string.IsNullOrEmpty(updatedByName))
                updatedByName = updatedByUser.Username ?? "Người dùng";
            
            // Get project leader (creator)
            var projectLeader = task.Project?.CreatedByNavigation;
            if (projectLeader == null) return;
            
            // Don't send email if the updater is the project leader
            if (projectLeader.Id == updatedByUserId) return;
            
            // Don't send email if project leader email is empty
            if (string.IsNullOrEmpty(projectLeader.Email)) return;
            
            var subject = $"[{task.Project?.Code ?? "PROJECT"}] Task đã được cập nhật: {task.Title}";
            var body = GenerateTaskUpdatedEmailBody(task, updatedByName);
            await SendEmailAsync(projectLeader.Email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send task updated email for task {TaskId}", taskId);
        }
    }
    public async System.Threading.Tasks.Task SendOverdueTasksDailyEmailAsync()
    {
        // Tạo scope mới để tránh lỗi disposed context khi được gọi từ background service
        using var scope = _scopeFactory.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<ProjectManagementDbContext>();
        
        try
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            
            // Lấy tất cả task quá hạn (DueDate < today và Status != "done")
            var overdueTasks = await ctx.Tasks
                .Include(t => t.Project)
                .Include(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
                .Where(t => t.DueDate != null 
                    && t.DueDate.Value.Date < today
                    && t.Status != "done")
                .ToListAsync();
            
            _logger.LogInformation("Found {Count} overdue tasks for daily email", overdueTasks.Count);
            
            if (!overdueTasks.Any())
            {
                _logger.LogInformation("No overdue tasks found. Daily email will not be sent.");
                return;
            }
            
            // Nhóm task theo người được giao
            var tasksByAssignee = new Dictionary<long, List<DataAccess.Models.Task>>();
            var projectLeaders = new HashSet<long>();
            
            foreach (var task in overdueTasks)
            {
                // Thêm project leader vào danh sách nhận email
                if (task.Project?.CreatedByNavigation != null)
                {
                    projectLeaders.Add(task.Project.CreatedByNavigation.Id);
                }
                
                // Thêm task vào danh sách của từng assignee
                foreach (var assignment in task.TaskAssignments)
                {
                    if (assignment.User != null && !string.IsNullOrEmpty(assignment.User.Email))
                    {
                        if (!tasksByAssignee.ContainsKey(assignment.User.Id))
                        {
                            tasksByAssignee[assignment.User.Id] = new List<DataAccess.Models.Task>();
                        }
                        tasksByAssignee[assignment.User.Id].Add(task);
                    }
                }
            }
            
            // Gửi email cho từng assignee
            foreach (var kvp in tasksByAssignee)
            {
                var userId = kvp.Key;
                var userTasks = kvp.Value;
                var user = await ctx.Users.FindAsync(userId);
                
                if (user == null || string.IsNullOrEmpty(user.Email)) continue;
                
                try
                {
                    var userName = $"{user.FirstName} {user.LastName}".Trim();
                    if (string.IsNullOrEmpty(userName))
                        userName = user.Username ?? "Người dùng";
                    
                    var subject = $"[ProjectHub] Báo cáo hàng ngày: {userTasks.Count} task quá hạn cần xử lý";
                    var body = GenerateOverdueTasksDailyEmailBody(userName, userTasks);
                    await SendEmailAsync(user.Email, subject, body);
                    _logger.LogInformation("Sent daily overdue tasks email to {Email} with {Count} tasks", user.Email, userTasks.Count);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send daily overdue tasks email to user {UserId}", userId);
                }
            }
            
            // Gửi email cho project leaders
            foreach (var leaderId in projectLeaders)
            {
                var leader = await ctx.Users.FindAsync(leaderId);
                if (leader == null || string.IsNullOrEmpty(leader.Email)) continue;
                
                // Lấy tất cả task quá hạn trong các project mà leader này quản lý
                var leaderTasks = overdueTasks
                    .Where(t => t.Project?.CreatedByNavigation?.Id == leaderId)
                    .ToList();
                
                if (!leaderTasks.Any()) continue;
                
                try
                {
                    var leaderName = $"{leader.FirstName} {leader.LastName}".Trim();
                    if (string.IsNullOrEmpty(leaderName))
                        leaderName = leader.Username ?? "Người dùng";
                    
                    var subject = $"[ProjectHub] Báo cáo hàng ngày: {leaderTasks.Count} task quá hạn trong dự án của bạn";
                    var body = GenerateOverdueTasksDailyEmailBody(leaderName, leaderTasks, isProjectLeader: true);
                    await SendEmailAsync(leader.Email, subject, body);
                    _logger.LogInformation("Sent daily overdue tasks email to project leader {Email} with {Count} tasks", leader.Email, leaderTasks.Count);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send daily overdue tasks email to project leader {LeaderId}", leaderId);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send daily overdue tasks email");
        }
    }
    private string GenerateOverdueTasksDailyEmailBody(string recipientName, List<DataAccess.Models.Task> tasks, bool isProjectLeader = false)
    {
        var taskCount = tasks.Count;
        var roleText = isProjectLeader ? "quản lý dự án" : "được giao";
        var headerText = isProjectLeader 
            ? "Báo cáo Task Quá Hạn trong Dự Án của Bạn" 
            : "Báo cáo Task Quá Hạn của Bạn";
        
        var tasksHtml = string.Join("", tasks.Select((task, index) =>
        {
            var projectCode = task.Project?.Code ?? "PROJECT";
            var projectName = task.Project?.Name ?? "Không xác định";
            var dueDate = task.DueDate?.ToString("dd/MM/yyyy HH:mm") ?? "Không có";
            var daysOverdue = task.DueDate.HasValue 
                ? (DateTime.UtcNow.Date - task.DueDate.Value.Date).Days 
                : 0;
            var status = task.Status ?? "todo";
            var priority = task.Priority ?? "medium";
            var assignees = task.TaskAssignments
                .Where(ta => ta.User != null)
                .Select(ta => $"{ta.User!.FirstName} {ta.User!.LastName}".Trim())
                .ToList();
            var assigneesText = assignees.Any() ? string.Join(", ", assignees) : "Chưa được giao";
            
            return $@"
            <tr style='border-bottom: 1px solid #e2e8f0;'>
                <td style='padding: 15px; vertical-align: top;'>
                    <div style='font-weight: 600; color: #0f172a; margin-bottom: 5px;'>{task.Title}</div>
                    <div style='font-size: 12px; color: #64748b;'>Mã: {projectCode}-{task.Id}</div>
                </td>
                <td style='padding: 15px; vertical-align: top;'>
                    <div style='font-size: 13px; color: #475569;'>{projectName}</div>
                </td>
                <td style='padding: 15px; vertical-align: top;'>
                    <div style='color: #ef4444; font-weight: 600;'>{dueDate}</div>
                    <div style='font-size: 12px; color: #ef4444;'>Quá hạn {daysOverdue} ngày</div>
                </td>
                <td style='padding: 15px; vertical-align: top;'>
                    <span style='display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; background-color: {GetStatusColor(status)};'>{GetStatusDisplayName(status)}</span>
                </td>
                <td style='padding: 15px; vertical-align: top;'>
                    <a href='{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}' style='color: #667eea; text-decoration: none; font-size: 13px;'>Xem chi tiết →</a>
                </td>
            </tr>";
        }));
        
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 700px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .count-badge {{ display: inline-block; padding: 10px 24px; background: rgba(255,255,255,0.95); color: #ef4444; border-radius: 25px; font-weight: 700; margin-top: 15px; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .greeting strong {{ color: #1e293b; font-size: 18px; }}
        .alert-box {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 25px 0; }}
        .alert-box p {{ margin: 0; color: #991b1b; font-weight: 600; font-size: 15px; }}
        .tasks-table {{ width: 100%; border-collapse: collapse; margin: 25px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
        .tasks-table thead {{ background: #f8fafc; }}
        .tasks-table th {{ padding: 15px; text-align: left; font-weight: 600; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .tasks-table td {{ padding: 15px; vertical-align: top; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
        @media only screen and (max-width: 600px) {{
            .content {{ padding: 25px 20px; }}
            .header {{ padding: 30px 20px; }}
            .tasks-table {{ font-size: 12px; }}
            .tasks-table th, .tasks-table td {{ padding: 10px; }}
        }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>🚨</div>
            <h1>{headerText}</h1>
            <div class='count-badge'>{taskCount} Task Quá Hạn</div>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào <strong>{recipientName}</strong>,</p>
                <p style='margin-top: 10px;'>Bạn có <strong>{taskCount} task quá hạn</strong> {roleText} cần được xử lý ngay.</p>
            </div>
            
            <div class='alert-box'>
                <p>⚠️ Vui lòng kiểm tra và hoàn thành các task quá hạn này càng sớm càng tốt.</p>
            </div>
            
            <table class='tasks-table'>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Dự án</th>
                        <th>Deadline</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {tasksHtml}
                </tbody>
            </table>
            
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{_settings.FrontendUrl}' style='display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);'>Xem tất cả task quá hạn</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Báo cáo này được gửi hàng ngày để nhắc nhở về các task quá hạn.<br>
                Vui lòng không trả lời email này. Nếu có thắc mắc, vui lòng liên hệ qua hệ thống.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GetStatusDisplayName(string status) => status switch
    {
        "todo" => "Cần làm",
        "in_progress" => "Đang làm",
        "review" => "Đang kiểm tra",
        "done" => "Đã hoàn thành",
        "blocked" => "Bị chặn",
        _ => status
    };
    private string GetStatusColor(string status) => status switch
    {
        "todo" => "#64748b",
        "in_progress" => "#3b82f6",
        "review" => "#f59e0b",
        "done" => "#10b981",
        "blocked" => "#ef4444",
        _ => "#64748b"
    };
    private string GetPriorityDisplayName(string? priority) => priority switch
    {
        "high" => "Cao",
        "medium" => "Trung bình",
        "low" => "Thấp",
        _ => "Trung bình"
    };
    private string GetPriorityColor(string? priority) => priority switch
    {
        "high" => "#ef4444",
        "medium" => "#f59e0b",
        "low" => "#10b981",
        _ => "#64748b"
    };
    private string GenerateStatusChangeEmailBody(DataAccess.Models.Task task, string oldStatus, string newStatus, string changedByName)
    {
        var projectName = task.Project?.Name ?? "Không xác định";
        var projectCode = task.Project?.Code ?? "PROJECT";
        var dueDate = task.DueDate?.ToString("dd/MM/yyyy HH:mm") ?? "Không có";
        var createdAt = task.CreatedAt?.ToString("dd/MM/yyyy HH:mm") ?? "N/A";
        var updatedAt = task.UpdatedAt?.ToString("dd/MM/yyyy HH:mm") ?? "N/A";
        var createdByName = task.CreatedByNavigation != null 
            ? $"{task.CreatedByNavigation.FirstName} {task.CreatedByNavigation.LastName}".Trim()
            : "Hệ thống";
        var assignees = task.TaskAssignments
            .Where(ta => ta.User != null)
            .Select(ta => $"{ta.User!.FirstName} {ta.User!.LastName}".Trim())
            .ToList();
        var assigneesText = assignees.Any() ? string.Join(", ", assignees) : "Chưa được giao";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .greeting strong {{ color: #1e293b; }}
        .status-change-box {{ background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e2e8f0; }}
        .status-change {{ display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap; }}
        .status-badge {{ padding: 12px 24px; border-radius: 25px; color: white; font-weight: 600; font-size: 14px; min-width: 120px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }}
        .arrow {{ font-size: 28px; color: #64748b; font-weight: bold; }}
        .task-info-card {{ background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .task-title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; }}
        .info-section {{ margin: 15px 0; }}
        .info-row {{ display: flex; margin: 12px 0; align-items: flex-start; }}
        .info-label {{ width: 140px; font-weight: 600; color: #64748b; font-size: 14px; flex-shrink: 0; }}
        .info-value {{ flex: 1; color: #1e293b; font-size: 14px; word-wrap: break-word; }}
        .badge {{ display: inline-block; padding: 6px 14px; border-radius: 16px; font-size: 12px; font-weight: 600; color: white; }}
        .priority-badge {{ background-color: {GetPriorityColor(task.Priority)}; }}
        .status-badge-inline {{ background-color: {GetStatusColor(newStatus)}; }}
        .assignees-list {{ color: #475569; }}
        .description-box {{ background: #f8fafc; border-left: 4px solid #667eea; padding: 15px; border-radius: 6px; margin-top: 10px; color: #475569; font-size: 14px; line-height: 1.7; }}
        .action-button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 15px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s; }}
        .action-button:hover {{ transform: translateY(-2px); }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
        .footer-text a {{ color: #667eea; text-decoration: none; }}
        .divider {{ height: 1px; background: #e2e8f0; margin: 25px 0; }}
        @media only screen and (max-width: 600px) {{
            .content {{ padding: 25px 20px; }}
            .header {{ padding: 30px 20px; }}
            .info-row {{ flex-direction: column; gap: 5px; }}
            .info-label {{ width: 100%; }}
        }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>🔄</div>
            <h1>Trạng thái Task đã thay đổi</h1>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào,</p>
                <p style='margin-top: 10px;'><strong>{changedByName}</strong> đã thay đổi trạng thái của task trong dự án của bạn.</p>
            </div>
            
            <div class='status-change-box'>
                <div class='status-change'>
                    <span class='status-badge' style='background-color: {GetStatusColor(oldStatus)}'>{GetStatusDisplayName(oldStatus)}</span>
                    <span class='arrow'>→</span>
                    <span class='status-badge' style='background-color: {GetStatusColor(newStatus)}'>{GetStatusDisplayName(newStatus)}</span>
                </div>
            </div>

            <div class='task-info-card'>
                <h3 class='task-title'>📋 {task.Title}</h3>
                
                <div class='info-section'>
                    <div class='info-row'>
                        <span class='info-label'>Mã task:</span>
                        <span class='info-value'><strong>{projectCode}-{task.Id}</strong></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Dự án:</span>
                        <span class='info-value'>{projectName}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Trạng thái:</span>
                        <span class='info-value'><span class='badge status-badge-inline'>{GetStatusDisplayName(newStatus)}</span></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Độ ưu tiên:</span>
                        <span class='info-value'><span class='badge priority-badge'>{GetPriorityDisplayName(task.Priority)}</span></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Người được giao:</span>
                        <span class='info-value assignees-list'>{assigneesText}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Deadline:</span>
                        <span class='info-value'><strong>{dueDate}</strong></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Người tạo:</span>
                        <span class='info-value'>{createdByName}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Thời gian tạo:</span>
                        <span class='info-value'>{createdAt}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Cập nhật lúc:</span>
                        <span class='info-value'>{updatedAt}</span>
                    </div>
                    {(task.Description != null && !string.IsNullOrWhiteSpace(task.Description) ? $@"
                    <div class='divider'></div>
                    <div class='info-row'>
                        <span class='info-label'>Mô tả:</span>
                        <div class='info-value'>
                            <div class='description-box'>{task.Description}</div>
                        </div>
                    </div>" : "")}
                </div>
            </div>

            <div class='button-container'>
                <a href='{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}' class='action-button'>Xem chi tiết công việc</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Vui lòng không trả lời email này. Nếu có thắc mắc, vui lòng liên hệ qua hệ thống.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateTaskAssignedEmailBody(DataAccess.Models.Task task, DataAccess.Models.User assignee, string assignedByName)
    {
        var projectName = task.Project?.Name ?? "Không xác định";
        var projectCode = task.Project?.Code ?? "PROJECT";
        var dueDate = task.DueDate?.ToString("dd/MM/yyyy HH:mm") ?? "Không có";
        var assigneeName = $"{assignee.FirstName} {assignee.LastName}".Trim();
        var createdAt = task.CreatedAt?.ToString("dd/MM/yyyy HH:mm") ?? "N/A";
        var createdByName = task.CreatedByNavigation != null 
            ? $"{task.CreatedByNavigation.FirstName} {task.CreatedByNavigation.LastName}".Trim()
            : "Hệ thống";
        var allAssignees = task.TaskAssignments
            .Where(ta => ta.User != null)
            .Select(ta => $"{ta.User!.FirstName} {ta.User!.LastName}".Trim())
            .ToList();
        var allAssigneesText = allAssignees.Any() ? string.Join(", ", allAssignees) : "Chưa được giao";
        var estimatedHours = task.EstimatedHours.HasValue ? $"{task.EstimatedHours.Value} giờ" : "Chưa ước tính";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .greeting strong {{ color: #1e293b; font-size: 18px; }}
        .highlight-box {{ background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0; }}
        .highlight-box p {{ margin: 0; color: #065f46; font-weight: 500; }}
        .task-info-card {{ background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .task-title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; }}
        .info-section {{ margin: 15px 0; }}
        .info-row {{ display: flex; margin: 12px 0; align-items: flex-start; }}
        .info-label {{ width: 140px; font-weight: 600; color: #64748b; font-size: 14px; flex-shrink: 0; }}
        .info-value {{ flex: 1; color: #1e293b; font-size: 14px; word-wrap: break-word; }}
        .badge {{ display: inline-block; padding: 6px 14px; border-radius: 16px; font-size: 12px; font-weight: 600; color: white; }}
        .priority-badge {{ background-color: {GetPriorityColor(task.Priority)}; }}
        .status-badge-inline {{ background-color: {GetStatusColor(task.Status ?? "todo")}; }}
        .assignees-list {{ color: #475569; }}
        .description-box {{ background: #f8fafc; border-left: 4px solid #10b981; padding: 15px; border-radius: 6px; margin-top: 10px; color: #475569; font-size: 14px; line-height: 1.7; }}
        .action-button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); transition: transform 0.2s; }}
        .action-button:hover {{ transform: translateY(-2px); }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
        .footer-text a {{ color: #10b981; text-decoration: none; }}
        .divider {{ height: 1px; background: #e2e8f0; margin: 25px 0; }}
        @media only screen and (max-width: 600px) {{
            .content {{ padding: 25px 20px; }}
            .header {{ padding: 30px 20px; }}
            .info-row {{ flex-direction: column; gap: 5px; }}
            .info-label {{ width: 100%; }}
        }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>✨</div>
            <h1>Bạn được giao task mới!</h1>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào <strong>{assigneeName}</strong>,</p>
                <p style='margin-top: 10px;'><strong>{assignedByName}</strong> đã giao cho bạn một task mới trong dự án.</p>
            </div>

            <div class='highlight-box'>
                <p>🎯 Hãy kiểm tra và bắt đầu công việc ngay nhé!</p>
            </div>

            <div class='task-info-card'>
                <h3 class='task-title'>📋 {task.Title}</h3>
                
                <div class='info-section'>
                    <div class='info-row'>
                        <span class='info-label'>Mã task:</span>
                        <span class='info-value'><strong>{projectCode}-{task.Id}</strong></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Dự án:</span>
                        <span class='info-value'>{projectName}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Trạng thái:</span>
                        <span class='info-value'><span class='badge status-badge-inline'>{GetStatusDisplayName(task.Status ?? "todo")}</span></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Độ ưu tiên:</span>
                        <span class='info-value'><span class='badge priority-badge'>{GetPriorityDisplayName(task.Priority)}</span></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Người được giao:</span>
                        <span class='info-value assignees-list'>{allAssigneesText}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Deadline:</span>
                        <span class='info-value'><strong style='color: #dc2626;'>{dueDate}</strong></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Giờ ước tính:</span>
                        <span class='info-value'>{estimatedHours}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Người tạo:</span>
                        <span class='info-value'>{createdByName}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Người giao:</span>
                        <span class='info-value'>{assignedByName}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Thời gian tạo:</span>
                        <span class='info-value'>{createdAt}</span>
                    </div>
                    {(task.Description != null && !string.IsNullOrWhiteSpace(task.Description) ? $@"
                    <div class='divider'></div>
                    <div class='info-row'>
                        <span class='info-label'>Mô tả:</span>
                        <div class='info-value'>
                            <div class='description-box'>{task.Description}</div>
                        </div>
                    </div>" : "")}
                </div>
            </div>

            <div class='button-container'>
                <a href='{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}' class='action-button'>Xem chi tiết công việc</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Vui lòng không trả lời email này. Nếu có thắc mắc, vui lòng liên hệ qua hệ thống.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateCommentEmailBody(DataAccess.Models.Task task, TaskComment comment, string commentByName)
    {
        var projectCode = task.Project?.Code ?? "PROJECT";
        var projectName = task.Project?.Name ?? "Không xác định";
        var commentContent = comment.Content ?? "";
        var commentTime = comment.CreatedAt?.ToString("dd/MM/yyyy HH:mm") ?? DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm");
        var taskStatus = task.Status ?? "todo";
        var taskPriority = task.Priority ?? "medium";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .task-reference {{ background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0; }}
        .task-reference-title {{ font-weight: 600; color: #1e40af; margin-bottom: 8px; font-size: 15px; }}
        .task-reference-link {{ color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px; }}
        .task-reference-link:hover {{ text-decoration: underline; }}
        .comment-box {{ background: #ffffff; border: 2px solid #dbeafe; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1); }}
        .comment-header {{ display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }}
        .comment-avatar {{ width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; }}
        .comment-author-info {{ flex: 1; }}
        .comment-author {{ font-weight: 600; color: #1e293b; font-size: 16px; }}
        .comment-time {{ color: #64748b; font-size: 13px; margin-top: 4px; }}
        .comment-content {{ color: #475569; font-size: 15px; line-height: 1.8; padding: 15px 0; }}
        .task-info-card {{ background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; }}
        .task-info-row {{ display: flex; margin: 8px 0; font-size: 14px; }}
        .task-info-label {{ width: 100px; font-weight: 600; color: #64748b; }}
        .task-info-value {{ flex: 1; color: #1e293b; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; }}
        .status-badge {{ background-color: {GetStatusColor(taskStatus)}; }}
        .priority-badge {{ background-color: {GetPriorityColor(taskPriority)}; }}
        .action-button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); transition: transform 0.2s; }}
        .action-button:hover {{ transform: translateY(-2px); }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
        .footer-text a {{ color: #3b82f6; text-decoration: none; }}
        @media only screen and (max-width: 600px) {{
            .content {{ padding: 25px 20px; }}
            .header {{ padding: 30px 20px; }}
            .task-info-row {{ flex-direction: column; gap: 5px; }}
            .task-info-label {{ width: 100%; }}
        }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>💬</div>
            <h1>Bình luận mới</h1>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào,</p>
                <p style='margin-top: 10px;'>Có bình luận mới trên task trong dự án của bạn.</p>
            </div>

            <div class='task-reference'>
                <div class='task-reference-title'>📋 Task được bình luận:</div>
                <a href='{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}' class='task-reference-link'>{projectCode}-{task.Id}: {task.Title}</a>
            </div>

            <div class='comment-box'>
                <div class='comment-header'>
                    <div class='comment-avatar'>{commentByName.Substring(0, 1).ToUpper()}</div>
                    <div class='comment-author-info'>
                        <div class='comment-author'>👤 {commentByName}</div>
                        <div class='comment-time'>🕐 {commentTime}</div>
                    </div>
                </div>
                <div class='comment-content'>{commentContent}</div>
            </div>

            <div class='task-info-card'>
                <div class='task-info-row'>
                    <span class='task-info-label'>Dự án:</span>
                    <span class='task-info-value'>{projectName}</span>
                </div>
                <div class='task-info-row'>
                    <span class='task-info-label'>Trạng thái:</span>
                    <span class='task-info-value'><span class='badge status-badge'>{GetStatusDisplayName(taskStatus)}</span></span>
                </div>
                <div class='task-info-row'>
                    <span class='task-info-label'>Độ ưu tiên:</span>
                    <span class='task-info-value'><span class='badge priority-badge'>{GetPriorityDisplayName(taskPriority)}</span></span>
                </div>
            </div>

            <div class='button-container'>
                <a href='{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}' class='action-button'>Xem và trả lời bình luận</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Vui lòng không trả lời email này. Nếu có thắc mắc, vui lòng liên hệ qua hệ thống.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateDueDateReminderEmailBody(DataAccess.Models.Task task, DataAccess.Models.User assignee)
    {
        var projectCode = task.Project?.Code ?? "PROJECT";
        var projectName = task.Project?.Name ?? "Không xác định";
        var dueDate = task.DueDate?.ToString("dd/MM/yyyy HH:mm") ?? "Không có";
        var assigneeName = $"{assignee.FirstName} {assignee.LastName}".Trim();
        var daysLeft = task.DueDate.HasValue 
            ? (task.DueDate.Value - DateTime.UtcNow).Days 
            : 0;
        var urgencyColor = daysLeft <= 0 ? "#ef4444" : daysLeft <= 1 ? "#f59e0b" : "#3b82f6";
        var urgencyBgColor = daysLeft <= 0 ? "#fef2f2" : daysLeft <= 1 ? "#fffbeb" : "#eff6ff";
        var urgencyText = daysLeft <= 0 ? "ĐÃ QUÁ HẠN" : daysLeft <= 1 ? "SẮP ĐẾN HẠN" : $"Còn {daysLeft} ngày";
        var urgencyIcon = daysLeft <= 0 ? "🚨" : daysLeft <= 1 ? "⚠️" : "⏰";
        var urgencyMessage = daysLeft <= 0 
            ? "Task này đã quá hạn! Vui lòng hoàn thành ngay lập tức." 
            : daysLeft <= 1 
            ? "Task này sắp đến hạn! Hãy ưu tiên hoàn thành." 
            : $"Task này sẽ đến hạn trong {daysLeft} ngày. Hãy lên kế hoạch hoàn thành.";
        var taskStatus = task.Status ?? "todo";
        var taskPriority = task.Priority ?? "medium";
        var estimatedHours = task.EstimatedHours.HasValue ? $"{task.EstimatedHours.Value} giờ" : "Chưa ước tính";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, {urgencyColor} 0%, {urgencyColor}dd 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .urgency-badge {{ display: inline-block; padding: 10px 24px; background: rgba(255,255,255,0.95); color: {urgencyColor}; border-radius: 25px; font-weight: 700; margin-top: 15px; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .greeting strong {{ color: #1e293b; font-size: 18px; }}
        .urgency-alert {{ background: {urgencyBgColor}; border-left: 4px solid {urgencyColor}; padding: 20px; border-radius: 8px; margin: 25px 0; }}
        .urgency-alert p {{ margin: 0; color: {urgencyColor}; font-weight: 600; font-size: 15px; }}
        .task-info-card {{ background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .task-title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; }}
        .info-section {{ margin: 15px 0; }}
        .info-row {{ display: flex; margin: 12px 0; align-items: flex-start; }}
        .info-label {{ width: 140px; font-weight: 600; color: #64748b; font-size: 14px; flex-shrink: 0; }}
        .info-value {{ flex: 1; color: #1e293b; font-size: 14px; word-wrap: break-word; }}
        .deadline-highlight {{ color: {urgencyColor}; font-weight: 700; font-size: 16px; }}
        .badge {{ display: inline-block; padding: 6px 14px; border-radius: 16px; font-size: 12px; font-weight: 600; color: white; }}
        .status-badge {{ background-color: {GetStatusColor(taskStatus)}; }}
        .priority-badge {{ background-color: {GetPriorityColor(taskPriority)}; }}
        .action-button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, {urgencyColor} 0%, {urgencyColor}dd 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 15px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); transition: transform 0.2s; }}
        .action-button:hover {{ transform: translateY(-2px); }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .link-text {{ text-align: center; margin-top: 15px; color: #64748b; font-size: 13px; }}
        .link-text a {{ color: {urgencyColor}; text-decoration: underline; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
        .footer-text a {{ color: {urgencyColor}; text-decoration: none; }}
        @media only screen and (max-width: 600px) {{
            .content {{ padding: 25px 20px; }}
            .header {{ padding: 30px 20px; }}
            .info-row {{ flex-direction: column; gap: 5px; }}
            .info-label {{ width: 100%; }}
        }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>{urgencyIcon}</div>
            <h1>Nhắc nhở Deadline</h1>
            <div class='urgency-badge'>{urgencyText}</div>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào <strong>{assigneeName}</strong>,</p>
            </div>

            <div class='urgency-alert'>
                <p>{urgencyMessage}</p>
            </div>

            <div class='task-info-card'>
                <h3 class='task-title'>📋 {task.Title}</h3>
                
                <div class='info-section'>
                    <div class='info-row'>
                        <span class='info-label'>Mã task:</span>
                        <span class='info-value'><strong>{projectCode}-{task.Id}</strong></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Dự án:</span>
                        <span class='info-value'>{projectName}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Deadline:</span>
                        <span class='info-value deadline-highlight'>{dueDate}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Trạng thái:</span>
                        <span class='info-value'><span class='badge status-badge'>{GetStatusDisplayName(taskStatus)}</span></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Độ ưu tiên:</span>
                        <span class='info-value'><span class='badge priority-badge'>{GetPriorityDisplayName(taskPriority)}</span></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Giờ ước tính:</span>
                        <span class='info-value'>{estimatedHours}</span>
                    </div>
                </div>
            </div>

            <div class='button-container'>
                <a href='{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}' class='action-button'>Xem chi tiết công việc</a>
            </div>

            <div class='link-text'>
                Hoặc truy cập trực tiếp:<br>
                <a href='{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}'>{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Vui lòng không trả lời email này. Nếu có thắc mắc, vui lòng liên hệ qua hệ thống.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateTaskUpdatedEmailBody(DataAccess.Models.Task task, string updatedByName)
    {
        var projectName = task.Project?.Name ?? "Không xác định";
        var projectCode = task.Project?.Code ?? "PROJECT";
        var dueDate = task.DueDate?.ToString("dd/MM/yyyy HH:mm") ?? "Không có";
        var createdAt = task.CreatedAt?.ToString("dd/MM/yyyy HH:mm") ?? "N/A";
        var updatedAt = task.UpdatedAt?.ToString("dd/MM/yyyy HH:mm") ?? "N/A";
        var createdByName = task.CreatedByNavigation != null 
            ? $"{task.CreatedByNavigation.FirstName} {task.CreatedByNavigation.LastName}".Trim()
            : "Hệ thống";
        var assignees = task.TaskAssignments
            .Where(ta => ta.User != null)
            .Select(ta => $"{ta.User!.FirstName} {ta.User!.LastName}".Trim())
            .ToList();
        var assigneesText = assignees.Any() ? string.Join(", ", assignees) : "Chưa được giao";
        var taskStatus = task.Status ?? "todo";
        var taskPriority = task.Priority ?? "medium";
        var estimatedHours = task.EstimatedHours.HasValue ? $"{task.EstimatedHours.Value} giờ" : "Chưa ước tính";
        var actualHours = task.ActualHours.HasValue ? $"{task.ActualHours.Value} giờ" : "Chưa có";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .greeting strong {{ color: #1e293b; }}
        .update-notice {{ background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0; }}
        .update-notice p {{ margin: 0; color: #1e40af; font-weight: 500; }}
        .task-info-card {{ background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .task-title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; }}
        .info-section {{ margin: 15px 0; }}
        .info-row {{ display: flex; margin: 12px 0; align-items: flex-start; }}
        .info-label {{ width: 140px; font-weight: 600; color: #64748b; font-size: 14px; flex-shrink: 0; }}
        .info-value {{ flex: 1; color: #1e293b; font-size: 14px; word-wrap: break-word; }}
        .badge {{ display: inline-block; padding: 6px 14px; border-radius: 16px; font-size: 12px; font-weight: 600; color: white; }}
        .priority-badge {{ background-color: {GetPriorityColor(taskPriority)}; }}
        .status-badge-inline {{ background-color: {GetStatusColor(taskStatus)}; }}
        .assignees-list {{ color: #475569; }}
        .description-box {{ background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin-top: 10px; color: #475569; font-size: 14px; line-height: 1.7; }}
        .update-info {{ background: #f8fafc; border-radius: 8px; padding: 15px; margin-top: 20px; }}
        .update-info-row {{ display: flex; margin: 8px 0; font-size: 13px; }}
        .update-info-label {{ width: 120px; font-weight: 600; color: #64748b; }}
        .update-info-value {{ flex: 1; color: #1e293b; }}
        .action-button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); transition: transform 0.2s; }}
        .action-button:hover {{ transform: translateY(-2px); }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
        .footer-text a {{ color: #3b82f6; text-decoration: none; }}
        .divider {{ height: 1px; background: #e2e8f0; margin: 25px 0; }}
        @media only screen and (max-width: 600px) {{
            .content {{ padding: 25px 20px; }}
            .header {{ padding: 30px 20px; }}
            .info-row {{ flex-direction: column; gap: 5px; }}
            .info-label {{ width: 100%; }}
            .update-info-row {{ flex-direction: column; gap: 5px; }}
            .update-info-label {{ width: 100%; }}
        }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>📝</div>
            <h1>Task đã được cập nhật</h1>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào,</p>
                <p style='margin-top: 10px;'><strong>{updatedByName}</strong> đã cập nhật task trong dự án của bạn.</p>
            </div>

            <div class='update-notice'>
                <p>📌 Task đã được chỉnh sửa. Vui lòng kiểm tra các thay đổi mới nhất.</p>
            </div>

            <div class='task-info-card'>
                <h3 class='task-title'>📋 {task.Title}</h3>
                
                <div class='info-section'>
                    <div class='info-row'>
                        <span class='info-label'>Mã task:</span>
                        <span class='info-value'><strong>{projectCode}-{task.Id}</strong></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Dự án:</span>
                        <span class='info-value'>{projectName}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Trạng thái:</span>
                        <span class='info-value'><span class='badge status-badge-inline'>{GetStatusDisplayName(taskStatus)}</span></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Độ ưu tiên:</span>
                        <span class='info-value'><span class='badge priority-badge'>{GetPriorityDisplayName(taskPriority)}</span></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Người được giao:</span>
                        <span class='info-value assignees-list'>{assigneesText}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Deadline:</span>
                        <span class='info-value'><strong>{dueDate}</strong></span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Giờ ước tính:</span>
                        <span class='info-value'>{estimatedHours}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Giờ thực tế:</span>
                        <span class='info-value'>{actualHours}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Người tạo:</span>
                        <span class='info-value'>{createdByName}</span>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Thời gian tạo:</span>
                        <span class='info-value'>{createdAt}</span>
                    </div>
                    {(task.Description != null && !string.IsNullOrWhiteSpace(task.Description) ? $@"
                    <div class='divider'></div>
                    <div class='info-row'>
                        <span class='info-label'>Mô tả:</span>
                        <div class='info-value'>
                            <div class='description-box'>{task.Description}</div>
                        </div>
                    </div>" : "")}
                </div>

                <div class='update-info'>
                    <div class='update-info-row'>
                        <span class='update-info-label'>Cập nhật bởi:</span>
                        <span class='update-info-value'><strong>{updatedByName}</strong></span>
                    </div>
                    <div class='update-info-row'>
                        <span class='update-info-label'>Thời gian cập nhật:</span>
                        <span class='update-info-value'><strong>{updatedAt}</strong></span>
                    </div>
                </div>
            </div>

            <div class='button-container'>
                <a href='{_settings.FrontendUrl}/board/{task.ProjectId}/task/{task.Id}' class='action-button'>Xem chi tiết công việc</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Vui lòng không trả lời email này. Nếu có thắc mắc, vui lòng liên hệ qua hệ thống.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    public async System.Threading.Tasks.Task SendTeamMemberAddedEmailAsync(long teamId, long userId, long addedByUserId)
    {
        try
        {
            var team = await _ctx.Teams
                .Include(t => t.Department)
                .FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null) return;
            
            var user = await _ctx.Users.FindAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.Email)) return;
            
            var addedByUser = await _ctx.Users.FindAsync(addedByUserId);
            var addedByName = addedByUser != null 
                ? $"{addedByUser.FirstName} {addedByUser.LastName}".Trim() 
                : "Hệ thống";
            
            var userName = $"{user.FirstName} {user.LastName}".Trim();
            if (string.IsNullOrEmpty(userName))
                userName = user.Username ?? "Người dùng";
            
            var subject = $"[ProjectHub] Bạn đã được thêm vào nhóm: {team.Name}";
            var body = GenerateTeamMemberAddedEmailBody(team, userName, addedByName);
            await SendEmailAsync(user.Email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send team member added email for team {TeamId}, user {UserId}", teamId, userId);
        }
    }
    public async System.Threading.Tasks.Task SendProjectMemberAddedEmailAsync(long projectId, long userId, long addedByUserId)
    {
        try
        {
            var project = await _ctx.Projects
                .Include(p => p.Team)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return;
            
            var user = await _ctx.Users.FindAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.Email)) return;
            
            var addedByUser = await _ctx.Users.FindAsync(addedByUserId);
            var addedByName = addedByUser != null 
                ? $"{addedByUser.FirstName} {addedByUser.LastName}".Trim() 
                : "Hệ thống";
            
            var userName = $"{user.FirstName} {user.LastName}".Trim();
            if (string.IsNullOrEmpty(userName))
                userName = user.Username ?? "Người dùng";
            
            var subject = $"[{project.Code ?? "PROJECT"}] Bạn đã được thêm vào dự án: {project.Name}";
            var body = GenerateProjectMemberAddedEmailBody(project, userName, addedByName);
            await SendEmailAsync(user.Email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send project member added email for project {ProjectId}, user {UserId}", projectId, userId);
        }
    }
    public async System.Threading.Tasks.Task SendProjectCreatedEmailAsync(long projectId, List<long> memberIds)
    {
        try
        {
            var project = await _ctx.Projects
                .Include(p => p.Team)
                .Include(p => p.CreatedByNavigation)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return;
            
            var members = await _ctx.Users
                .Where(u => memberIds.Contains(u.Id))
                .ToListAsync();
            
            var createdByName = project.CreatedByNavigation != null 
                ? $"{project.CreatedByNavigation.FirstName} {project.CreatedByNavigation.LastName}".Trim() 
                : "Hệ thống";
            
            foreach (var member in members)
            {
                if (string.IsNullOrEmpty(member.Email)) continue;
                
                var memberName = $"{member.FirstName} {member.LastName}".Trim();
                if (string.IsNullOrEmpty(memberName))
                    memberName = member.Username ?? "Người dùng";
                
                var subject = $"[{project.Code ?? "PROJECT"}] Dự án mới: {project.Name}";
                var body = GenerateProjectCreatedEmailBody(project, memberName, createdByName);
                await SendEmailAsync(member.Email, subject, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send project created email for project {ProjectId}", projectId);
        }
    }
    private string GenerateTeamMemberAddedEmailBody(DataAccess.Models.Team team, string userName, string addedByName)
    {
        var departmentName = team.Department?.Name ?? "Không xác định";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .greeting strong {{ color: #1e293b; font-size: 18px; }}
        .info-card {{ background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .info-row {{ display: flex; margin: 12px 0; align-items: flex-start; }}
        .info-label {{ width: 140px; font-weight: 600; color: #64748b; font-size: 14px; flex-shrink: 0; }}
        .info-value {{ flex: 1; color: #1e293b; font-size: 14px; }}
        .action-button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>👥</div>
            <h1>Bạn đã được thêm vào nhóm</h1>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào <strong>{userName}</strong>,</p>
                <p style='margin-top: 10px;'><strong>{addedByName}</strong> đã thêm bạn vào nhóm.</p>
            </div>
            <div class='info-card'>
                <div class='info-row'>
                    <span class='info-label'>Tên nhóm:</span>
                    <span class='info-value'><strong>{team.Name}</strong></span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Phòng ban:</span>
                    <span class='info-value'>{departmentName}</span>
                </div>
            </div>
            <div class='button-container'>
                <a href='{_settings.FrontendUrl}/teams' class='action-button'>Xem nhóm</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Vui lòng không trả lời email này.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateProjectMemberAddedEmailBody(DataAccess.Models.Project project, string userName, string addedByName)
    {
        var projectCode = project.Code ?? "PROJECT";
        var teamName = project.Team?.Name ?? "Không xác định";
        var startDate = project.StartDate?.ToString("dd/MM/yyyy") ?? "Chưa có";
        var dueDate = project.DueDate?.ToString("dd/MM/yyyy") ?? "Chưa có";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .greeting strong {{ color: #1e293b; font-size: 18px; }}
        .info-card {{ background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .info-row {{ display: flex; margin: 12px 0; align-items: flex-start; }}
        .info-label {{ width: 140px; font-weight: 600; color: #64748b; font-size: 14px; flex-shrink: 0; }}
        .info-value {{ flex: 1; color: #1e293b; font-size: 14px; }}
        .action-button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 15px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>📁</div>
            <h1>Bạn đã được thêm vào dự án</h1>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào <strong>{userName}</strong>,</p>
                <p style='margin-top: 10px;'><strong>{addedByName}</strong> đã thêm bạn vào dự án.</p>
            </div>
            <div class='info-card'>
                <div class='info-row'>
                    <span class='info-label'>Mã dự án:</span>
                    <span class='info-value'><strong>{projectCode}</strong></span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Tên dự án:</span>
                    <span class='info-value'><strong>{project.Name}</strong></span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Nhóm:</span>
                    <span class='info-value'>{teamName}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Ngày bắt đầu:</span>
                    <span class='info-value'>{startDate}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Ngày kết thúc:</span>
                    <span class='info-value'>{dueDate}</span>
                </div>
            </div>
            <div class='button-container'>
                <a href='{_settings.FrontendUrl}/board/{project.Id}' class='action-button'>Xem dự án</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Vui lòng không trả lời email này.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateProjectCreatedEmailBody(DataAccess.Models.Project project, string memberName, string createdByName)
    {
        var projectCode = project.Code ?? "PROJECT";
        var teamName = project.Team?.Name ?? "Không xác định";
        var startDate = project.StartDate?.ToString("dd/MM/yyyy") ?? "Chưa có";
        var dueDate = project.DueDate?.ToString("dd/MM/yyyy") ?? "Chưa có";
        var description = !string.IsNullOrWhiteSpace(project.Description) ? project.Description : "Không có mô tả";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .email-wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }}
        .header-icon {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 16px; color: #475569; margin-bottom: 20px; }}
        .greeting strong {{ color: #1e293b; font-size: 18px; }}
        .info-card {{ background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .info-row {{ display: flex; margin: 12px 0; align-items: flex-start; }}
        .info-label {{ width: 140px; font-weight: 600; color: #64748b; font-size: 14px; flex-shrink: 0; }}
        .info-value {{ flex: 1; color: #1e293b; font-size: 14px; }}
        .description-box {{ background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin-top: 10px; color: #475569; font-size: 14px; line-height: 1.7; }}
        .action-button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ color: #64748b; font-size: 13px; line-height: 1.8; }}
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <div class='header-icon'>🎉</div>
            <h1>Dự án mới đã được tạo</h1>
        </div>
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào <strong>{memberName}</strong>,</p>
                <p style='margin-top: 10px;'><strong>{createdByName}</strong> đã tạo dự án mới và bạn đã được thêm vào dự án này.</p>
            </div>
            <div class='info-card'>
                <div class='info-row'>
                    <span class='info-label'>Mã dự án:</span>
                    <span class='info-value'><strong>{projectCode}</strong></span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Tên dự án:</span>
                    <span class='info-value'><strong>{project.Name}</strong></span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Nhóm:</span>
                    <span class='info-value'>{teamName}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Ngày bắt đầu:</span>
                    <span class='info-value'>{startDate}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Ngày kết thúc:</span>
                    <span class='info-value'>{dueDate}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Mô tả:</span>
                    <div class='info-value'>
                        <div class='description-box'>{description}</div>
                    </div>
                </div>
            </div>
            <div class='button-container'>
                <a href='{_settings.FrontendUrl}/board/{project.Id}' class='action-button'>Xem dự án</a>
            </div>
        </div>
        <div class='footer'>
            <p class='footer-text'>
                Email này được gửi tự động từ hệ thống <strong>ProjectHub</strong>.<br>
                Vui lòng không trả lời email này.
            </p>
        </div>
    </div>
</body>
</html>";
    }
}
