using FalFul.Application.DTOs.ChatAI;

namespace FalFul.Application.Interfaces
{
    public interface IChatService
    {
        Task<ChatResult> ChatAsync(
            string sessionId,
            string userMessage,
            IReadOnlyList<ChatCartItemDto>? chatCartItems,
            IReadOnlyList<ManualCartItemDto>? manualCartItems,
            CancellationToken ct = default);
    }
}
