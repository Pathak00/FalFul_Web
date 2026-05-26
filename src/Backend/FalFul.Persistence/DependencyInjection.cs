using FalFul.Application.Interfaces;
using FalFul.Persistence.Context;
using FalFul.Persistence.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace FalFul.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services)
    {
        services.AddSingleton<DapperContext>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPageRepository, PageRepository>();
        services.AddScoped<IBannerRepository, BannerRepository>();
        services.AddScoped<IHomepageSectionRepository, HomepageSectionRepository>();
        services.AddScoped<IAdminRepository, AdminRepository>();
        services.AddScoped<IMenuRepository, MenuRepository>();
        return services;
    }
}
