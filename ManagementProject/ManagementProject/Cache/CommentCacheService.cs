using ManagementProject.DTO;
using Microsoft.Extensions.Caching.Memory;
namespace ManagementProject.Cache;
public class CommentCacheService
{
    private readonly IMemoryCache _cache;
    private readonly MemoryCacheEntryOptions _options;
    public CommentCacheService(IMemoryCache cache)
    {
        _cache = cache;
        _options = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(TimeSpan.FromMinutes(3))
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
    }
    private string GetKey(long taskId) => $"comments:task:{taskId}";
    public List<CommentDto>? GetComments(long taskId)
        => _cache.TryGetValue(GetKey(taskId), out List<CommentDto> comments) ? comments : null;
    public void SetComments(long taskId, List<CommentDto> comments)
        => _cache.Set(GetKey(taskId), comments, _options);
    public void Invalidate(long taskId)
        => _cache.Remove(GetKey(taskId));
}