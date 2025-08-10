using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
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

// EF Core + SQLite

// Build a writeable path for Azure App Service Linux
string home = Environment.GetEnvironmentVariable("HOME") ?? builder.Environment.ContentRootPath; // local dev fallback
string dataDirectory = Path.Combine(home, "site", "data", "reacttaskmanager");

// Create the data directory
Directory.CreateDirectory(dataDirectory);

string dbPath = Path.Combine(dataDirectory, "reacttaskmanager.db");

// Allow override from an env var or app setting
string? connection = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connection))
{
    connection = $"Data Source={dbPath}";
}

builder.Services.AddDbContext<TodoContext>(o => o.UseSqlite(connection));

// Identity Core
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

// Reset token lifetime (optional)
builder.Services.Configure<DataProtectionTokenProviderOptions>(o =>
{
    o.TokenLifespan = TimeSpan.FromHours(2);
});

// Simple dev email sender
builder.Services.AddSingleton<ReactTaskManager.Api.Services.IEmailSender, ConsoleEmailSender>();
// JWT auth
var jwt = builder.Configuration.GetSection("Jwt");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
var keyBytesValidator = Encoding.UTF8.GetBytes(jwt["Key"]!);

Console.WriteLine("VALIDATOR key fp: " +
  Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(keyBytesValidator)).Substring(0, 16));


builder.Services.AddScoped<TokenService>();
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

// CORS for your React dev server
builder.Services.AddCors(o =>
{
    o.AddPolicy("Frontend", p => p
        .WithOrigins("http://localhost:3000", "https://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddControllers();

// Swagger with Bearer support
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
    {
        c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    }

    c.AddServer(new Microsoft.OpenApi.Models.OpenApiServer { Url = "/" });

    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "React Task Manager API",
        Version = "v1",
        Description = "Simple task API with JWT auth, filtering, sorting, and Kanban board reorder.",
        Contact = new OpenApiContact { Name = "Your Name", Email = "you@example.com" },
        License = new OpenApiLicense { Name = "MIT" }
    });
});

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TodoContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    logger.LogInformation("ConnStr(DefaultConnection) = {conn}", cfg.GetConnectionString("DefaultConnection"));

    // What migrations are compiled into this DLL?
    var migAsm = db.GetService<IMigrationsAssembly>();
    logger.LogInformation("MigrationsAssembly = {asm}", migAsm.Assembly.GetName().Name);
    logger.LogInformation("Compiled migrations = {migs}", string.Join(", ", migAsm.Migrations.Keys));
    Console.WriteLine($"Compiled migrations = {string.Join(", ", migAsm.Migrations.Keys)}");

    var applied = db.Database.GetAppliedMigrations().ToList();
    var pending = db.Database.GetPendingMigrations().ToList();
    logger.LogInformation("Applied: {applied}", string.Join(", ", applied));
    logger.LogInformation("Pending: {pending}", string.Join(", ", pending));

    try
    {
        db.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");
        db.Database.ExecuteSqlRaw("PRAGMA busy_timeout=5000;"); // 5s wait if locked
        db.Database.ExecuteSqlRaw("PRAGMA synchronous=NORMAL;");
    }
    catch
    {
        //TODO: add logging here
    }

    db.Database.Migrate();
}
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "v1")); // Remove the options to turn this off in production

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html"); // SPA fallback

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
