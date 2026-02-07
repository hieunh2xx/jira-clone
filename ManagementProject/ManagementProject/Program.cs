
using AutoMapper;
using DataAccess.Models;
using ManagementProject.Cache;
using ManagementProject.DTO;
using ManagementProject.Mappers;
using ManagementProject.Repositories;
using ManagementProject.Repository;
using ManagementProject.Services;
using ManagementProject.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;

// Force TLS 1.2 or higher for all connections
System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12 | System.Net.SecurityProtocolType.Tls13;
System.Net.ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };

var builder = WebApplication.CreateBuilder(args);
var cloudinarySettings = builder.Configuration.GetSection("CloudinarySettings").Get<CloudinarySettings>()
                        ?? throw new InvalidOperationException("CloudinarySettings is missing in appsettings.json");
builder.Services.AddSingleton(cloudinarySettings);
builder.Services.AddSingleton<CloudinaryService>();
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHostedService<TaskReminderBackgroundService>();
builder.Services.AddHostedService<AutoRunBackgroundService>();
builder.Services.AddHostedService<KeepAliveBackgroundService>();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromDays(365);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<ProjectManagementDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.")));
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<UserCacheService>();
builder.Services.AddScoped<TaskCacheService>();
builder.Services.AddScoped<CommentCacheService>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();
builder.Services.AddScoped<ITaskCommentService, TaskCommentService>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<IScrumBoardRepository, ScrumBoardRepository>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IScrumBoardService, ScrumBoardService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IJwtService, JwtService>();
// Azure Blob Service (optional - chỉ cần nếu muốn dùng Azure thay vì Cloudinary)
try
{
    var azureSettings = builder.Configuration.GetSection("AzureBlobSettings").Get<ManagementProject.DTO.AzureBlobSettings>();
    if (azureSettings != null && !string.IsNullOrEmpty(azureSettings.ConnectionString))
    {
        builder.Services.AddScoped<IAzureBlobService, AzureBlobService>();
    }
}
catch
{
    // Azure Blob không được cấu hình, bỏ qua
}
builder.Services.AddScoped<IPowerBIExportService, PowerBIExportService>();
builder.Services.AddScoped<IImprovementReportService, ImprovementReportService>();
builder.Services.AddScoped<IProjectEvaluationRepository, ProjectEvaluationRepository>();
builder.Services.AddScoped<IProjectEvaluationService, ProjectEvaluationService>();
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey is missing");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ManagementProject";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ManagementProjectClient";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SystemAdminOnly", policy => policy.RequireRole("system_admin"));
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("system_admin", "admin"));
    options.AddPolicy("ProjectManager", policy => policy.RequireRole("system_admin", "admin", "project_manager"));
    options.AddPolicy("TeamLead", policy => policy.RequireRole("system_admin", "admin", "project_manager", "team_lead"));
    options.AddPolicy("Developer", policy => policy.RequireRole("system_admin", "admin", "project_manager", "team_lead", "developer"));
    options.AddPolicy("UserAuthenticated", policy => policy.RequireAuthenticatedUser());
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = false;
    });
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600;
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
    options.MultipartBoundaryLengthLimit = int.MaxValue;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ManagementProject API", Version = "v1" });
    // Configure Swagger to handle file uploads properly
    c.MapType<IFormFile>(() => new Microsoft.OpenApi.Models.OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
var app = builder.Build();
app.ConfigureExceptionHandler(app.Environment);

// Log CORS requests for debugging (only in Development)
if (app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        var origin = context.Request.Headers["Origin"].ToString();
        var method = context.Request.Method;
        var path = context.Request.Path;
        if (!string.IsNullOrEmpty(origin) || method == "OPTIONS")
        {
            Console.WriteLine($"[CORS Debug] {method} {path} - Origin: {origin ?? "none"}");
        }
        await next();
    });
}

// Only use HTTPS redirection in Development or if explicitly configured
// In Production on IIS, if backend runs on HTTP (port 5002), disable HTTPS redirection
// to avoid 307 redirects that break API calls
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
// For Production, HTTPS redirection should be handled by IIS/load balancer if needed

app.UseSession();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("./v1/swagger.json", "ManagementProject API v1");
    c.RoutePrefix = "swagger";
    if (!app.Environment.IsDevelopment())
    {
        c.DefaultModelsExpandDepth(-1);
        c.DisplayRequestDuration();
    }
});
app.UseRouting();
// CORS must be between UseRouting and UseAuthentication/UseAuthorization for endpoint routing
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();