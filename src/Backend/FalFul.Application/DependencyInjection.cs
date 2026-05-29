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
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IDeliveryService, DeliveryService>();
        services.AddScoped<IAppSettingService, AppSettingService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IPermissionService, PermissionService>();
        return services;
    }
}
