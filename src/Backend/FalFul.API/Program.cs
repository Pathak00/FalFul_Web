using FalFul.API;
using FalFul.API.Authorization;
using FalFul.API.Middleware;
using FalFul.API.Startup;
using FalFul.Application;
using FalFul.Application.Interfaces;
using FalFul.ChatAI;
using FalFul.Infrastructure;
using FalFul.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;



var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
        opt.JsonSerializerOptions.Converters.Add(new NullableUtcDateTimeConverter());
    });
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FalFul API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document),
            new List<string>()
        }
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPersistence();
builder.Services.AddScoped<FalFul.API.Services.IFileService, FalFul.API.Services.FileService>();
builder.Services.AddChatAI();

builder.Services.AddHostedService<ImageUrlNormalizationService>();

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Jwt:Key is not configured. Set it via appsettings.Development.json locally or Jwt__Key in Azure App Service settings.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep raw JWT claim names (sub, email, jti) instead of mapping them to
        // the long ClaimTypes URIs. Without this, User.FindFirstValue("sub") returns
        // null because the middleware remaps sub → ClaimTypes.NameIdentifier.
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// PermissionPolicyProvider handles any [Authorize(Policy="Perm:<key>")] dynamically.
// No manual policy registration needed — permission keys are resolved from DB at runtime.
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FalFulPolicy", policy =>
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? ["http://localhost:4300"])
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "FalFul API v1");
});

app.MapGet("/env", (IWebHostEnvironment env) => env.EnvironmentName);

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("FalFulPolicy");
app.UseStaticFiles();
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
