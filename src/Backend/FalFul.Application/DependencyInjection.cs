using FalFul.Application.Interfaces;
using FalFul.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FalFul.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICmsService, CmsService>();
        services.AddScoped<IAdminService, AdminService>();
        return services;
    }
}
