using FalFul.Application.Interfaces;
using FalFul.Infrastructure.Gateways;
using FalFul.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FalFul.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();

        // Payment gateways — resolved by IEnumerable<IPaymentGateway>, picked by .Code
        services.AddScoped<IPaymentGateway, CodGateway>();

        services.Configure<ESewaConfig>(config.GetSection("PaymentGateways:eSewa"));
        services.AddScoped<IPaymentGateway, ESewaGateway>();

        return services;
    }
}
