using FalFul.Application.Interfaces;
using FalFul.Persistence.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace FalFul.ChatAI
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddChatAI(this IServiceCollection service)
        {
            service.AddMemoryCache();
            service.AddSingleton<IChatSessionStore, InMemoryChatSessionStore>();

            service.AddHttpClient<IChatService, OllamaChatService>();
            service.AddHttpClient<IFruitInfoSearchService, WikipediaFruitInfoService>();

            service.AddScoped<IProductRepository, ProductRepository>();

            return service;
        }
    }
}
