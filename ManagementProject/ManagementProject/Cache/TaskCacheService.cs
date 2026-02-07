
using ManagementProject.DTO;
using Microsoft.Extensions.Caching.Memory;
namespace ManagementProject.Cache
{
    public class TaskCacheService
    {
        private readonly IMemoryCache _cache;
        private readonly MemoryCacheEntryOptions _cacheOptions;
        public TaskCacheService(IMemoryCache cache)
        {
            _cache = cache;
            _cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(5))
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(15));
        }
        private string GetTaskKey(long taskId) => $"task:{taskId}";
        private string GetAllTasksKey(long projectId, long? epicId = null) =>
            epicId.HasValue ? $"tasks:project:{projectId}:epic:{epicId}" : $"tasks:project:{projectId}";
        public TaskDto? GetTask(long taskId)
        {
            _cache.TryGetValue(GetTaskKey(taskId), out TaskDto? task);
            return task;
        }
        public void SetTask(TaskDto task)
        {
            _cache.Set(GetTaskKey(task.Id), task, _cacheOptions);
        }
        public void RemoveTask(long taskId)
        {
            _cache.Remove(GetTaskKey(taskId));
        }
        public List<TaskDto>? GetAllTasks(long projectId, long? epicId = null)
        {
            _cache.TryGetValue(GetAllTasksKey(projectId, epicId), out List<TaskDto> tasks);
            return tasks;
        }
        public void SetAllTasks(long projectId, List<TaskDto> tasks, long? epicId = null)
        {
            _cache.Set(GetAllTasksKey(projectId, epicId), tasks, _cacheOptions);
        }
        public void InvalidateAllTasks(long projectId, long? epicId = null)
        {
            _cache.Remove(GetAllTasksKey(projectId, epicId));
        }
    }
}