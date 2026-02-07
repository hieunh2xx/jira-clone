
using ManagementProject.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
namespace ManagementProject.Controllers;
[ApiController]
[Route("api/[controller]")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailController> _logger;
    public EmailController(IEmailService emailService, ILogger<EmailController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }
    [HttpPost("test")]
    public async Task<IActionResult> SendTestEmail([FromBody] SendTestEmailRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
        {
            return BadRequest(new { message = "Email is required" });
        }
        try
        {
            var subject = "ProjectHub - Test Email";
            var body = GenerateTestEmailBody();
            _logger.LogInformation("Attempting to send test email to {Email}", request.Email);
            await _emailService.SendEmailAsync(request.Email, subject, body);
            _logger.LogInformation("Test email API call completed for {Email}. Check logs for actual send status.", request.Email);
            return Ok(new { 
                message = "Test email API call completed. Check email inbox and spam folder. Check server logs for detailed status.", 
                email = request.Email,
                note = "If email not received, check: 1) Spam folder, 2) Microsoft Graph permissions, 3) FromEmail configuration"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test email to {Email}. Exception: {Exception}", request.Email, ex.ToString());
            return StatusCode(500, new { 
                message = "Failed to send test email", 
                error = ex.Message,
                details = ex.ToString()
            });
        }
    }
    [HttpGet("status")]
    public IActionResult GetEmailStatus()
    {
        // Get email service to check actual status
        var emailServiceType = _emailService.GetType();
        var settingsField = emailServiceType.GetField("_settings", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        var graphClientField = emailServiceType.GetField("_graphClient", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        
        var settings = settingsField?.GetValue(_emailService) as EmailSettings;
        var graphClient = graphClientField?.GetValue(_emailService);
        
        return Ok(new
        {
            isConfigured = settings != null,
            isEnabled = settings?.IsEnabled ?? false,
            provider = settings?.Provider ?? "Unknown",
            hasGraphClient = graphClient != null,
            fromEmail = settings?.MicrosoftGraph?.FromEmail ?? "Not configured",
            tenantId = !string.IsNullOrEmpty(settings?.MicrosoftGraph?.TenantId) ? "Configured" : "Not configured",
            clientId = !string.IsNullOrEmpty(settings?.MicrosoftGraph?.ClientId) ? "Configured" : "Not configured",
            hasClientSecret = !string.IsNullOrEmpty(settings?.MicrosoftGraph?.ClientSecret),
            message = graphClient != null 
                ? "Email service is configured and ready" 
                : "Email service is configured but Graph client is not initialized. Check logs for details."
        });
    }
    [HttpPost("send-overdue-tasks-daily")]
    public async Task<IActionResult> SendOverdueTasksDailyEmail()
    {
        try
        {
            _logger.LogInformation("Triggering daily overdue tasks email from API endpoint");
            await _emailService.SendOverdueTasksDailyEmailAsync();
            return Ok(new 
            { 
                code = 200,
                message = "Daily overdue tasks email sent successfully",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send daily overdue tasks email from API endpoint");
            return StatusCode(500, new 
            { 
                code = 500,
                message = "Failed to send daily overdue tasks email", 
                error = ex.Message 
            });
        }
    }
    [HttpPost("send-test-email-hieu")]
    public async Task<IActionResult> SendTestEmailToHieu()
    {
        try
        {
            string testEmail = "hieu.nguy.huy1@vn.ricoh.com";
            _logger.LogInformation("Sending test email to {Email}", testEmail);
            
            var subject = "Test Email - ProjectHub System";
            var body = GenerateTestEmailBody();
            
            await _emailService.SendEmailAsync(testEmail, subject, body);
            
            _logger.LogInformation("Test email sent successfully to {Email}", testEmail);
            return Ok(new 
            { 
                code = 200,
                message = $"Test email đã được gửi thành công đến {testEmail}",
                email = testEmail,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test email to hieu.nguy.huy1@vn.ricoh.com");
            return StatusCode(500, new 
            { 
                code = 500,
                message = "Failed to send test email", 
                error = ex.Message,
                details = ex.ToString()
            });
        }
    }
    private string GenerateTestEmailBody()
    {
        return @"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; text-align: center; }
        .success-icon { font-size: 64px; margin-bottom: 20px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✅ Email Test Thành Công!</h1>
        </div>
        <div class='content'>
            <div class='success-icon'>🎉</div>
            <h2>Cấu hình email hoạt động tốt!</h2>
            <p>Nếu bạn nhận được email này, điều đó có nghĩa là hệ thống thông báo email của ProjectHub đã được cấu hình đúng.</p>
            <p>Bạn sẽ nhận được thông báo khi:</p>
            <ul style='text-align: left; display: inline-block;'>
                <li>Trạng thái task thay đổi</li>
                <li>Được giao task mới</li>
                <li>Có bình luận mới trên task</li>
                <li>Task sắp đến hạn hoặc quá hạn</li>
            </ul>
        </div>
        <div class='footer'>
            <p>Email này được gửi từ hệ thống ProjectHub.</p>
            <p>© 2025 ProjectHub - Task Management System</p>
        </div>
    </div>
</body>
</html>";
    }
}
public class SendTestEmailRequest
{
    public string Email { get; set; } = "";
}