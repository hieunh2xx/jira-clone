using System.Net;
using ManagementProject.DTO;
using Microsoft.AspNetCore.Diagnostics;
using System.Text.Json;
namespace ManagementProject.Middleware;
public static class GlobalExceptionHandler
{
    public static void ConfigureExceptionHandler(this IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                context.Response.ContentType = "application/json";
                var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
                var exception = exceptionHandlerPathFeature?.Error;
                if (exception == null)
                {
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        code = 500,
                        message = "Đã xảy ra lỗi không xác định",
                        data = (object?)null
                    }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
                    return;
                }
                var response = exception switch
                {
                    UnauthorizedAccessException => new ResponeError<object?>
                    {
                        Code = 401,
                        Message = exception.Message,
                        Data = null
                    },
                    KeyNotFoundException => new ResponeError<object?>
                    {
                        Code = 404,
                        Message = exception.Message,
                        Data = null
                    },
                    ArgumentNullException => new ResponeError<object?>
                    {
                        Code = 400,
                        Message = exception.Message,
                        Data = null
                    },
                    ArgumentException => new ResponeError<object?>
                    {
                        Code = 400,
                        Message = exception.Message,
                        Data = null
                    },
                    InvalidOperationException => new ResponeError<object?>
                    {
                        Code = 500,
                        Message = exception.Message,
                        Data = env.IsDevelopment() ? new { 
                            exceptionType = exception.GetType().Name,
                            stackTrace = exception.StackTrace,
                            innerException = exception.InnerException?.Message
                        } : null
                    },
                    _ => new ResponeError<object?>
                    {
                        Code = 500,
                        Message = env.IsDevelopment() ? exception.Message : "Đã xảy ra lỗi hệ thống",
                        Data = env.IsDevelopment() ? new { 
                            exceptionType = exception.GetType().Name,
                            stackTrace = exception.StackTrace,
                            innerException = exception.InnerException?.Message
                        } : null
                    }
                };
                context.Response.StatusCode = response.Code;
                await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }));
            });
        });
    }
}