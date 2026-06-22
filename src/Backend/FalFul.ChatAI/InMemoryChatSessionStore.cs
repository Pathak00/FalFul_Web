using FalFul.Application.DTOs.ChatAI;
using FalFul.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace FalFul.ChatAI
{
    public class InMemoryChatSessionStore : IChatSessionStore
    {
        private static readonly TimeSpan SessionLifetime = TimeSpan.FromMinutes(30);
        private const int MaxMessagesPerSession = 20;

        private readonly IMemoryCache _cache;

        public InMemoryChatSessionStore(IMemoryCache cache)
        {
            _cache = cache;
        }

        public IReadOnlyList<ChatMessage> GetHistory(string sessionId)
        {
            return _cache.TryGetValue(sessionId, out List<ChatMessage>? history)
                ? history!
                : Array.Empty<ChatMessage>();
        }

        public void Append(string sessionId, ChatMessage message)
        {
            var history = _cache.GetOrCreate(sessionId, entry =>
            {
                entry.SlidingExpiration = SessionLifetime;
                return new List<ChatMessage>();
            })!;

            history.Add(message);

            if (history.Count > MaxMessagesPerSession)
                history.RemoveRange(0, history.Count - MaxMessagesPerSession);
        }
    }
}
