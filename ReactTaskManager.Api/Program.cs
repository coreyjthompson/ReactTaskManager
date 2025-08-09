using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ReactTaskManager.Api.Data;
using ReactTaskManager.Api.Models;
using ReactTaskManager.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// EF Core + SQLite
builder.Services.AddDbContext<TodoContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

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

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "v1")); // Remove the options to turn this off in production

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
