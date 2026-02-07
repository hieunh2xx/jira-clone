
using System.Threading.Tasks;
namespace ManagementProject.Services;
public interface IEmailService
{
    System.Threading.Tasks.Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    System.Threading.Tasks.Task SendTaskStatusChangedEmailAsync(long taskId, string oldStatus, string newStatus, long changedByUserId);
    System.Threading.Tasks.Task SendTaskAssignedEmailAsync(long taskId, List<long> assigneeIds, long assignedByUserId);
    System.Threading.Tasks.Task SendTaskCommentEmailAsync(long taskId, long commentId, long commentByUserId);
    System.Threading.Tasks.Task SendTaskDueDateReminderEmailAsync(long taskId);
    System.Threading.Tasks.Task SendTaskUpdatedEmailAsync(long taskId, long updatedByUserId);
    System.Threading.Tasks.Task SendOverdueTasksDailyEmailAsync();
    System.Threading.Tasks.Task SendTeamMemberAddedEmailAsync(long teamId, long userId, long addedByUserId);
    System.Threading.Tasks.Task SendProjectMemberAddedEmailAsync(long projectId, long userId, long addedByUserId);
    System.Threading.Tasks.Task SendProjectCreatedEmailAsync(long projectId, List<long> memberIds);
}