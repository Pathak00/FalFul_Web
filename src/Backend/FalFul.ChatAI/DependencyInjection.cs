using FalFul.Application.Interfaces;
using FalFul.ChatAI.Plugins;
using FalFul.Persistence.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace FalFul.ChatAI
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddChatAI(this IServiceCollection services)
        {
            services.AddMemoryCache();

            services.AddScoped<IProductRepository, ProductRepository>();
            services.AddHttpClient<IFruitInfoSearchService, WikipediaFruitInfoService>();

            // Ambient per-request session id, set by OllamaChatService before the tool
            // loop runs, so plugins built here (before sessionId is known) can find it.
            services.AddScoped<ChatSessionContext>();

            // Scoped kernel so plugins can hold the scoped IProductRepository.
            // The Ollama chat completion service is wired directly into the kernel builder.
            services.AddScoped(sp =>
            {
                var config = sp.GetRequiredService<IConfiguration>();
                var model = config["Ollama:Model"] ?? "qwen2.5:3b";
                var endpoint = new Uri(config["Ollama:BaseUrl"] ?? "http://localhost:11434");

                var builder = Kernel.CreateBuilder();
                builder.AddOllamaChatCompletion(model, endpoint);
                var kernel = builder.Build();

                kernel.FunctionInvocationFilters.Add(new FunctionInvocationLogger());

                kernel.Plugins.AddFromObject(
                    new FruitStorePlugin(sp.GetRequiredService<IProductRepository>()), "FruitStore");
                kernel.Plugins.AddFromObject(
                    new CutFruitOrderPlugin(sp.GetRequiredService<IProductRepository>()), "CutFruitOrder");
                kernel.Plugins.AddFromObject(
                    new FruitInfoPlugin(sp.GetRequiredService<IFruitInfoSearchService>()), "FruitInfo");
                kernel.Plugins.AddFromObject(
                    new CartPlugin(
                        sp.GetRequiredService<IProductRepository>(),
                        sp.GetRequiredService<ChatSessionContext>()), "Cart");

                foreach (var plugin in kernel.Plugins)
                {
                    Console.WriteLine($"Plugin: {plugin.Name}");

                    foreach (var function in plugin)
                    {
                        Console.WriteLine($"  Function: {function.Name}");
                    }
                }

                return kernel;
            });
         


            services.AddScoped<IChatCompletionService>(
                sp => sp.GetRequiredService<Kernel>().GetRequiredService<IChatCompletionService>());

            services.AddScoped<IChatService, OllamaChatService>();

            return services;
        }
    }
}
