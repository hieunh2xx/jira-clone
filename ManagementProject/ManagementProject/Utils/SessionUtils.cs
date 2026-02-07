using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using ManagementProject.DTO;
namespace ManagementProject.Utils
{
    public static class SessionUtils
    {
        private const string UserSessionKey = "UserSession";
        public static void SetUserSession(IHttpContextAccessor accessor, UserDto user)
        {
            var session = accessor.HttpContext?.Session;
            if (session == null) return;
            var json = JsonConvert.SerializeObject(user);
            session.SetString(UserSessionKey, json);
        }
        public static UserDto? GetUserSession(IHttpContextAccessor accessor)
        {
            var session = accessor.HttpContext?.Session;
            if (session == null)
                return null;
            var json = session.GetString(UserSessionKey);
            if (string.IsNullOrEmpty(json))
                return null;
            try
            {
                return JsonConvert.DeserializeObject<UserDto>(json);
            }
            catch
            {
                return null;
            }
        }
        public static void ClearUserSession(IHttpContextAccessor accessor)
        {
            var session = accessor.HttpContext?.Session;
            session?.Remove(UserSessionKey);
        }
    }
}