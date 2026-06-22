using FalFul.Application.DTOs.ChatAI;

namespace FalFul.Application.Interfaces
{
    public interface IChatSessionStore
    {
        IReadOnlyList<ChatMessage> GetHistory(string sessionId);

        void Append(string sessionId, ChatMessage message);
    }
}
