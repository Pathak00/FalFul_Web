using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Persistence.Context;
using FalFul.Persistence.Repositories;
using FalFul.Persistence.TypeHandlers;
using Microsoft.Extensions.DependencyInjection;

namespace FalFul.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services)
    {
        SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());

        services.AddSingleton<DapperContext>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPageRepository, PageRepository>();
        services.AddScoped<IBannerRepository, BannerRepository>();
        services.AddScoped<IHomepageSectionRepository, HomepageSectionRepository>();
        services.AddScoped<IAdminRepository, AdminRepository>();
        services.AddScoped<IMenuRepository, MenuRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IAddressRepository, AddressRepository>();
        services.AddScoped<IPriceRuleRepository, PriceRuleRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IDeliveryRepository, DeliveryRepository>();
        services.AddScoped<IDeliveryAttemptRepository, DeliveryAttemptRepository>();
        services.AddScoped<IDeliveryIssueRepository, DeliveryIssueRepository>();
        services.AddScoped<IOrderRatingRepository, OrderRatingRepository>();
        services.AddScoped<IAppSettingRepository, AppSettingRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IAdminNavRepository, AdminNavRepository>();
        return services;
    }
}
