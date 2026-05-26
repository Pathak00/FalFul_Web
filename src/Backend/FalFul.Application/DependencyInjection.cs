using FalFul.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FalFul.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
