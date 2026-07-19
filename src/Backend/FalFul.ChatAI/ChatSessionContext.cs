namespace FalFul.ChatAI;

// Scoped ambient holder so kernel plugins (built without knowing the sessionId) can
// find out which session's cart to read/write. Set once per request by
// OllamaChatService.ChatAsync before the tool loop runs.
public sealed class ChatSessionContext
{
    public string? SessionId { get; set; }

    // Built fresh from the client's request each turn (never persisted server-side) —
    // the browser's cart is the single source of truth. Non-null only once the client
    // has supplied its cart for this attempt; see OllamaChatService.ChatAsync.
    public Cart? CurrentCart { get; set; }
}
