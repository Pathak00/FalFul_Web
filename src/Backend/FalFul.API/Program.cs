using System.Text;
using FalFul.API;
using FalFul.API.Authorization;
using FalFul.API.Middleware;
using FalFul.Application;
using FalFul.Infrastructure;
using FalFul.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
        opt.JsonSerializerOptions.Converters.Add(new NullableUtcDateTimeConverter());
    });
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, _) =>
    {
        document.Info.Title = "FalFul API";
        document.Info.Description = "FalFul Fruit eCommerce REST API";
        return Task.CompletedTask;
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPersistence();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");

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
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? ["http://localhost:4200"])
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("FalFul API")
        .AddPreferredSecuritySchemes("Bearer")
        .AddHttpAuthentication("Bearer", _ => { });
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
