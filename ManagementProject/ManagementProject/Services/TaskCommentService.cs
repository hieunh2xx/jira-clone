using DataAccess.Models;
using ManagementProject.DTO;
using ManagementProject.Repositories;
using ManagementProject.Cache;
using Microsoft.EntityFrameworkCore;
using System.Linq;
namespace ManagementProject.Services;
public class TaskCommentService : ITaskCommentService
{
    private readonly ITaskCommentRepository _repo;
    private readonly ProjectManagementDbContext _ctx;
    private readonly CommentCacheService _cache;
    private readonly TaskCacheService _taskCache;
    private readonly CloudinaryService _cloudinary;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    public TaskCommentService(
        ITaskCommentRepository repo,
        ProjectManagementDbContext ctx,
        CommentCacheService cache,
        TaskCacheService taskCache,
        CloudinaryService cloudinaryService,
        IEmailService emailService,
        INotificationService notificationService)
    {
        _repo = repo;
        _ctx = ctx;
        _cache = cache;
        _taskCache = taskCache;
        _cloudinary = cloudinaryService;
        _emailService = emailService;
        _notificationService = notificationService;
    }
    public async Task<CommentDto> CreateCommentAsync(long taskId, CreateCommentRequest dto, IFormFile[]? files, CancellationToken ct = default)
    {
        var taskExists = await _ctx.Tasks.AnyAsync(t => t.Id == taskId, ct);
        if (!taskExists) throw new KeyNotFoundException($"Task {taskId} không tồn tại.");
        var userExists = await _ctx.Users.AnyAsync(u => u.Id == dto.UserId, ct);
        if (!userExists) throw new KeyNotFoundException($"User {dto.UserId} không tồn tại.");
        var comment = new TaskComment
        {
            TaskId = taskId,
            UserId = dto.UserId,
            Content = dto.Content,
            ParentCommentId = dto.ParentCommentId,
            IsReview = dto.IsReview,
            Rating = dto.Rating,
            CreatedAt = DateTime.UtcNow
        };
        var images = new List<TaskCommentImage>();
        var commentFiles = new List<TaskCommentFile>();
        if (files != null && files.Length > 0)
        {
            foreach (var file in files)
            {
                var fileName = file.FileName?.ToLower() ?? "";
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
                var isImage = file.ContentType?.StartsWith("image/") == true ||
                              imageExtensions.Any(ext => fileName.EndsWith(ext));
                if (isImage)
                {
                    using var stream = file.OpenReadStream();
                    var uploadResult = _cloudinary.UploadImage(stream, file.FileName);
                    if (uploadResult == null || uploadResult.SecureUrl == null)
                    {
                        throw new InvalidOperationException($"Không thể upload ảnh {file.FileName}");
                    }
                    var image = new TaskCommentImage
                    {
                        CommentId = 0,
                        ImageUrl = uploadResult.SecureUrl.ToString(),
                        FileName = file.FileName,
                        FileSizeKb = (int)(file.Length / 1024),
                        UploadedAt = DateTime.UtcNow,
                        UploadedBy = dto.UserId
                    };
                    images.Add(image);
                    if (images.Count == 1) comment.ImageUrl = image.ImageUrl;
                }
                else
                {
                    using var stream = file.OpenReadStream();
                    var fileUploadResult = _cloudinary.UploadFile(stream, file.FileName);
                    if (fileUploadResult == null || fileUploadResult.SecureUrl == null)
                    {
                        throw new InvalidOperationException($"Không thể upload file {file.FileName}");
                    }
                    var commentFile = new TaskCommentFile
                    {
                        CommentId = 0,
                        FileUrl = fileUploadResult.SecureUrl.ToString(),
                        FileName = file.FileName,
                        FileSizeKb = (int)(file.Length / 1024),
                        UploadedAt = DateTime.UtcNow,
                        UploadedBy = dto.UserId
                    };
                    commentFiles.Add(commentFile);
                }
            }
        }
        try
        {
            var created = await _repo.CreateAsync(comment, images, commentFiles, ct);
            _cache.Invalidate(taskId);
            _taskCache.RemoveTask(taskId);
            try
            {
                await _emailService.SendTaskCommentEmailAsync(taskId, created.Id, dto.UserId);
            }
            catch
            {
            }
            try
            {
                await _notificationService.NotifyTaskCommentAsync(taskId, created.Id, dto.UserId, dto.Content ?? "", ct);
            }
            catch
            {
            }
            return await MapToDto(created, ct);
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException($"Lỗi khi lưu comment: {ex.InnerException?.Message}", ex);
        }
    }
    public async Task<List<CommentDto>> GetCommentsByTaskIdAsync(long taskId, CancellationToken ct = default)
    {
        var cached = _cache.GetComments(taskId);
        if (cached != null) return cached;
        var comments = await _repo.GetByTaskIdAsync(taskId, ct);
        var dtos = await System.Threading.Tasks.Task.WhenAll(comments.Where(c => c.ParentCommentId == null)
            .Select(c => MapWithReplies(c, comments, ct)));
        var result = dtos.OrderBy(c => c.CreatedAt).ToList();
        _cache.SetComments(taskId, result);
        return result;
    }
    public async Task<CommentDto> UpdateCommentAsync(long commentId, UpdateCommentRequest dto, IFormFile[]? files = null, CancellationToken ct = default)
    {
        var comment = await _repo.GetByIdAsync(commentId, ct) ?? throw new KeyNotFoundException();
        if (dto.Content != null) comment.Content = dto.Content;
        if (dto.IsReview.HasValue) comment.IsReview = dto.IsReview.Value;
        if (dto.Rating.HasValue) comment.Rating = dto.Rating.Value;
        var newImages = new List<TaskCommentImage>();
        var newFiles = new List<TaskCommentFile>();
        if (files != null && files.Length > 0)
        {
            foreach (var file in files)
            {
                var fileName = file.FileName?.ToLower() ?? "";
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
                var isImage = file.ContentType?.StartsWith("image/") == true ||
                              imageExtensions.Any(ext => fileName.EndsWith(ext));
                if (isImage)
                {
                    using var stream = file.OpenReadStream();
                    var uploadResult = _cloudinary.UploadImage(stream, file.FileName);
                    if (uploadResult == null || uploadResult.SecureUrl == null)
                    {
                        throw new InvalidOperationException($"Không thể upload ảnh {file.FileName}");
                    }
                    var image = new TaskCommentImage
                    {
                        CommentId = comment.Id,
                        ImageUrl = uploadResult.SecureUrl.ToString(),
                        FileName = file.FileName,
                        FileSizeKb = (int)(file.Length / 1024),
                        UploadedAt = DateTime.UtcNow,
                        UploadedBy = comment.UserId
                    };
                    newImages.Add(image);
                }
                else
                {
                    using var stream = file.OpenReadStream();
                    var fileUploadResult = _cloudinary.UploadFile(stream, file.FileName);
                    if (fileUploadResult == null || fileUploadResult.SecureUrl == null)
                    {
                        throw new InvalidOperationException($"Không thể upload file {file.FileName}");
                    }
                    var commentFile = new TaskCommentFile
                    {
                        CommentId = comment.Id,
                        FileUrl = fileUploadResult.SecureUrl.ToString(),
                        FileName = file.FileName,
                        FileSizeKb = (int)(file.Length / 1024),
                        UploadedAt = DateTime.UtcNow,
                        UploadedBy = comment.UserId
                    };
                    newFiles.Add(commentFile);
                }
            }
        }
        try
        {
            await _repo.UpdateAsync(comment, newImages, newFiles, ct);
            _cache.Invalidate(comment.TaskId);
            _taskCache.RemoveTask(comment.TaskId);
            return await MapToDto(comment, ct);
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException($"Lỗi khi cập nhật comment: {ex.InnerException?.Message}", ex);
        }
    }
    public async System.Threading.Tasks.Task DeleteCommentAsync(long commentId, CancellationToken ct = default)
    {
        var comment = await _repo.GetByIdAsync(commentId, ct);
        if (comment == null) return;
        if (comment.TaskCommentImages != null)
        {
            foreach (var img in comment.TaskCommentImages)
            {
                _cloudinary.DeleteImage(img.ImageUrl);
            }
        }
        if (comment.TaskCommentFiles != null)
        {
            foreach (var file in comment.TaskCommentFiles)
            {
                _cloudinary.DeleteFile(file.FileUrl);
            }
        }
        await _repo.DeleteAsync(commentId, ct);
        _cache.Invalidate(comment.TaskId);
        _taskCache.RemoveTask(comment.TaskId);
    }
    async System.Threading.Tasks.Task<CommentDto> ITaskCommentService.UpdateCommentAsync(long commentId, UpdateCommentRequest dto, CancellationToken ct)
    {
        return await UpdateCommentAsync(commentId, dto, null, ct);
    }
    private async Task<CommentDto> MapWithReplies(TaskComment root, List<TaskComment> all, CancellationToken ct)
    {
        var replies = all.Where(c => c.ParentCommentId == root.Id).ToList();
        return new CommentDto
        {
            Id = root.Id,
            Content = root.Content ?? "",
            PrimaryImageUrl = root.ImageUrl,
            AdditionalImages = root.TaskCommentImages?.Select(i => new CommentImageDto
            {
                Id = i.Id,
                ImageUrl = i.ImageUrl,
                FileName = i.FileName,
                FileSizeKb = i.FileSizeKb,
                UploadedAt = i.UploadedAt ?? DateTime.UtcNow
            }).ToList() ?? new(),
            Files = root.TaskCommentFiles?.Select(f => new CommentFileDto
            {
                Id = f.Id,
                FileUrl = f.FileUrl,
                FileName = f.FileName,
                FileSizeKb = f.FileSizeKb,
                UploadedAt = f.UploadedAt ?? DateTime.UtcNow
            }).ToList() ?? new(),
            UserId = root.UserId,
            Username = root.User?.Username ?? "Unknown",
            FullName = $"{root.User?.FirstName} {root.User?.LastName}".Trim(),
            IsReview = root.IsReview ?? false,
            Rating = root.Rating,
            ParentCommentId = root.ParentCommentId,
            TaskId = root.TaskId,
            CreatedAt = root.CreatedAt ?? DateTime.UtcNow,
            Replies = replies.Count > 0
                ? (await System.Threading.Tasks.Task.WhenAll(replies.Select(r => MapWithReplies(r, all, ct)))).ToList()
                : new()
        };
    }
    private async Task<CommentDto> MapToDto(TaskComment c, CancellationToken ct)
        => await MapWithReplies(c, await _repo.GetByTaskIdAsync(c.TaskId, ct), ct);
}