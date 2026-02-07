
using Microsoft.Extensions.Caching.Memory;
using ManagementProject.DTO;
namespace ManagementProject.Cache
{
    public class UserCacheService
    {
        private readonly IMemoryCache _cache;
        private readonly MemoryCacheEntryOptions _cacheOptions;
        private const string AllUsersKey = "users:all"; 
        public UserCacheService(IMemoryCache cache)
        {
            _cache = cache;
            _cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(10))  
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(30))
                .SetPriority(CacheItemPriority.Normal);
        }
        private string GetKey(long userId) => $"user:{userId}";
        public UserDto? Get(long userId)
        {
            _cache.TryGetValue(GetKey(userId), out UserDto? user);
            return user;
        }
        public void Set(UserDto user)
        {
            _cache.Set(GetKey(user.Id), user, _cacheOptions);
        }
        public void Remove(long userId)
        {
            _cache.Remove(GetKey(userId));
        }
        public List<UserDto>? GetAll()
        {
            _cache.TryGetValue(AllUsersKey, out List<UserDto> users);
            return users;
        }
        public void SetAll(List<UserDto> users)
        {
            _cache.Set(AllUsersKey, users, _cacheOptions);
        }
        public void InvalidateAll()
        {
            _cache.Remove(AllUsersKey);
        }
        public void ClearAll()
        {
            InvalidateAll();
        }
    }
}