namespace FalFul.Application.Interfaces
{
    public interface IChatService
    {
        Task<string> ChatAsync(string sessionId, string userMessage, CancellationToken ct = default);
    }
}
