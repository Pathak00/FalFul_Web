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
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IDiscountService, DiscountService>();
        services.AddScoped<INoticeService, NoticeService>();
        services.AddScoped<IReceiptService, ReceiptService>();
        services.AddScoped<IPasswordResetService, PasswordResetService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<INoticeService, NoticeService>();
        return services;
    }
}
