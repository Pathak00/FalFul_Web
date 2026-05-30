using FalFul.Application.Interfaces;
using FalFul.Infrastructure.Gateways;
using FalFul.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

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

        services.Configure<KhaltiConfig>(config.GetSection("PaymentGateways:Khalti"));
        services.AddHttpClient("Khalti", (sp, client) =>
        {
            var cfg = sp.GetRequiredService<IOptions<KhaltiConfig>>().Value;
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Key", cfg.SecretKey);
        });
        services.AddScoped<IPaymentGateway, KhaltiGateway>();

        return services;
    }
}
