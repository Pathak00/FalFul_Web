using FalFul.Application.DTOs.ChatAI;
using FalFul.Application.Interfaces;
using FalFul.Persistence.Repositories;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text.Json;

public class OllamaChatService : IChatService
{
    private readonly HttpClient _http;
    private readonly string _model;
    private readonly IProductRepository _product;
    private readonly IChatSessionStore _sessions;
    private readonly IFruitInfoSearchService _fruitInfo;

    public OllamaChatService(
        HttpClient http,
        IConfiguration config,
        IProductRepository productRepo,
        IChatSessionStore sessions,
        IFruitInfoSearchService fruitInfo)
    {
        _http = http;
        _model = config["Ollama:Model"] ?? "llama3";
        _http.BaseAddress = new Uri(config["Ollama:BaseUrl"] ?? "http://localhost:11434");
        _product = productRepo;
        _sessions = sessions;
        _fruitInfo = fruitInfo;
    }

    public async Task<string> ChatAsync(string sessionId, string userMessage, CancellationToken ct = default)
    {
        _sessions.Append(sessionId, new ChatMessage("user", userMessage));

        var intent = await DetectIntentAsync(userMessage, ct);

        var reply = intent switch
        {
            QueryType.Store => await BuildStoreReplyAsync(sessionId, ct),
            QueryType.FruitKnowledge => await BuildFruitKnowledgeReplyAsync(sessionId, userMessage, ct),
            _ => await BuildGeneralReplyAsync(sessionId, ct)
        };

        _sessions.Append(sessionId, new ChatMessage("assistant", reply));

        return reply;
    }

    private async Task<QueryType> DetectIntentAsync(string userMessage, CancellationToken ct)
    {
        var prompt = $"""
You are an intent classifier for a fruit chatbot.

Classify the user message into ONE category:

STORE
- Buying fruits
- Price, stock, availability, ordering, delivery

FRUIT_KNOWLEDGE
- Nutrition, health benefits, vitamins
- Merits, demerits, fruit facts and comparisons

GENERAL
- Greetings (hello, hi, hey)
- Small talk
- Anything not related to fruits or store

IMPORTANT RULES:
- If the message is a greeting or very short (hello, hi), ALWAYS return GENERAL
- Base decision ONLY on the user message
- Return ONLY one word: STORE, FRUIT_KNOWLEDGE, or GENERAL

User message:
{userMessage}
""";

        var result = await GenerateAsync(prompt, ct);

        return result.Trim().ToUpperInvariant() switch
        {
            "STORE" => QueryType.Store,
            "FRUIT_KNOWLEDGE" => QueryType.FruitKnowledge,
            _ => QueryType.General
        };
    }

    private async Task<string> BuildStoreReplyAsync(string sessionId, CancellationToken ct)
    {
        var dbFruits = await _product.GetAllAsync(null, null);
        var dbFruitsText = string.Join(", ",
            dbFruits.Select(f => $"{f.Name} (Price: {f.Price}, Stock: {f.Stock})"));

        var systemPrompt = $"""
You are FalFul's store assistant. Answer questions about price, stock, and availability using ONLY the fruits listed below. If a fruit isn't listed, say it's currently unavailable. Keep replies short and friendly.

AVAILABLE FRUITS:
{dbFruitsText}
""";

        return await ChatCompletionAsync(sessionId, systemPrompt, ct);
    }

    private async Task<string> BuildFruitKnowledgeReplyAsync(string sessionId, string userMessage, CancellationToken ct)
    {
        var fruitName = await ResolveFruitNameAsync(userMessage, ct);
        var summary = fruitName is null ? null : await _fruitInfo.GetSummaryAsync(fruitName, ct);

        var systemPrompt = summary is null
            ? "You are FalFul's fruit knowledge assistant. Answer questions about fruit nutrition, health merits, and demerits helpfully and concisely."
            : $"""
You are FalFul's fruit knowledge assistant. Use the reference information below to answer the user's question about merits, demerits, nutrition, or health benefits. Summarize in a friendly, concise way and don't just copy it verbatim.

REFERENCE INFO ABOUT {fruitName!.ToUpperInvariant()}:
{summary}
""";

        return await ChatCompletionAsync(sessionId, systemPrompt, ct);
    }

    private async Task<string> BuildGeneralReplyAsync(string sessionId, CancellationToken ct)
    {
        const string systemPrompt = "You are FalFul's friendly assistant for an online fruit store. Keep replies short and warm.";

        return await ChatCompletionAsync(sessionId, systemPrompt, ct);
    }

    private async Task<string?> ResolveFruitNameAsync(string userMessage, CancellationToken ct)
    {
        var dbFruits = await _product.GetAllAsync(null, null);

        var match = dbFruits.FirstOrDefault(f =>
            userMessage.Contains(f.Name, StringComparison.OrdinalIgnoreCase));

        return match?.Name;
    }

    private async Task<string> ChatCompletionAsync(string sessionId, string systemPrompt, CancellationToken ct)
    {
        var history = _sessions.GetHistory(sessionId);

        var messages = new List<object> { new { role = "system", content = systemPrompt } };
        messages.AddRange(history.Select(m => (object)new { role = m.Role, content = m.Content }));

        var body = new { model = _model, messages, stream = false };

        var res = await _http.PostAsJsonAsync("/api/chat", body, ct);
        res.EnsureSuccessStatusCode();

        var json = await res.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: ct);

        return json!.RootElement.GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private async Task<string> GenerateAsync(string prompt, CancellationToken ct)
    {
        var body = new { model = _model, prompt, stream = false };

        var res = await _http.PostAsJsonAsync("/api/generate", body, ct);
        res.EnsureSuccessStatusCode();

        var json = await res.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: ct);

        return json!.RootElement.GetProperty("response").GetString() ?? "";
    }
}
