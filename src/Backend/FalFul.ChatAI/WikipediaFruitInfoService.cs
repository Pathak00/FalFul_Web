using FalFul.Application.Interfaces;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace FalFul.ChatAI
{
    public class WikipediaFruitInfoService : IFruitInfoSearchService
    {
        private readonly HttpClient _http;

        public WikipediaFruitInfoService(HttpClient http)
        {
            _http = http;
            _http.BaseAddress = new Uri("https://en.wikipedia.org/api/rest_v1/");
            if (!_http.DefaultRequestHeaders.UserAgent.Any())
                _http.DefaultRequestHeaders.UserAgent.ParseAdd("FalFul-ChatBot/1.0 (https://falful.example)");
        }

        public async Task<string?> GetSummaryAsync(string fruitName, CancellationToken ct = default)
        {
            var res = await _http.GetAsync($"page/summary/{Uri.EscapeDataString(fruitName)}", ct);

            if (res.StatusCode == HttpStatusCode.NotFound)
                return null;

            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: ct);

            if (!json!.RootElement.TryGetProperty("extract", out var extract))
                return null;

            var text = extract.GetString();
            if (string.IsNullOrWhiteSpace(text)) return null;

            // Keep only the first 3 sentences so the LLM gets a concise fact block
            var sentences = text.Split(new[] { ". " }, StringSplitOptions.RemoveEmptyEntries);
            return sentences.Length <= 3
                ? text
                : string.Join(". ", sentences[..3]) + ".";
        }
    }
}
