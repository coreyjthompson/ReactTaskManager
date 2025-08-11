using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ReactTaskManager.Api.Data;
using ReactTaskManager.Api.Models;
using ReactTaskManager.Api.Services;

var builder = WebApplication.CreateBuilder(args);

string? configured = builder.Configuration.GetConnectionString("Default");
string connStr;

if (!string.IsNullOrWhiteSpace(configured))
{
    // Local dev or explicit Azure setting
    connStr = configured;
}
else
{
    // Fallback for Azure App Service
    string home = Environment.GetEnvironmentVariable("HOME")
                  ?? Environment.GetEnvironmentVariable("USERPROFILE")
                  ?? builder.Environment.ContentRootPath;

    string dataDir = Path.Combine(home, "site", "data", "reacttaskmanager");
    Directory.CreateDirectory(dataDir); // only create when we use it

    string dbPath = Path.Combine(dataDir, "todo.db");
    connStr = $"Data Source={dbPath}";
}

builder.Services.AddDbContext<TodoContext>(o => o.UseSqlite(connStr));

builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireDigit = false;
    })
    .AddEntityFrameworkStores<TodoContext>()
    .AddSignInManager<SignInManager<AppUser>>()
    .AddDefaultTokenProviders();

builder.Services.Configure<DataProtectionTokenProviderOptions>(o =>
{
    o.TokenLifespan = TimeSpan.FromHours(2);
});

builder.Services.AddSingleton<IEmailSender, ConsoleEmailSender>();
builder.Services.AddScoped<TokenService>();

var jwt = builder.Configuration.GetSection("Jwt");
var signingKey = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured"))
);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = true,
            ValidIssuer = jwt["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwt["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "")
    .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(o =>
    o.AddPolicy("Frontend", p =>
        p.WithOrigins(allowedOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod()
    )
);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter Bearer {token}"
    };
    c.AddSecurityDefinition("Bearer", scheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference
            { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });

    var xml = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xml);
    if (File.Exists(xmlPath))
        c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
});

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TodoContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var migAsm = db.GetService<IMigrationsAssembly>();

    logger.LogInformation("ConnStr(Default) = {conn}", connStr);
    logger.LogInformation("MigrationsAssembly = {asm}", migAsm.Assembly.GetName().Name);
    logger.LogInformation("Compiled migrations = {migs}", string.Join(", ", migAsm.Migrations.Keys));

    var applied = db.Database.GetAppliedMigrations().ToList();
    var pending = db.Database.GetPendingMigrations().ToList();
    logger.LogInformation("Applied: {applied}", string.Join(", ", applied));
    logger.LogInformation("Pending: {pending}", string.Join(", ", pending));

    db.Database.Migrate();
    try
    {
        db.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");
        db.Database.ExecuteSqlRaw("PRAGMA busy_timeout=5000;");
        db.Database.ExecuteSqlRaw("PRAGMA synchronous=NORMAL;");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Failed to apply SQLite PRAGMAs.");
    }
}

app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "v1"));

app.UseCors("Frontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Helpful for CORS preflight on any path
app.MapMethods("{*path}", new[] { "OPTIONS" }, () => Results.Ok()).AllowAnonymous();

app.MapGet("/health", (TodoContext db, IConfiguration cfg) =>
{
    var ds = db.Database.GetDbConnection().DataSource ?? "(unknown)";
    var origins = cfg["Cors:AllowedOrigins"] ?? "";

    return Results.Ok(new { DataSource = ds, AllowedOrigins = origins });

}).AllowAnonymous();

app.Run();
