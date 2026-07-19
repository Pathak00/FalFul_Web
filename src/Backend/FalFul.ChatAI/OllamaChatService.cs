using FalFul.Application.DTOs.ChatAI;
using FalFul.Application.Interfaces;
using FalFul.ChatAI;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using OpenAI.Chat;
using System.Reflection.Metadata.Ecma335;
using System.Runtime.CompilerServices;
using System.Text.Json;

public class OllamaChatService : IChatService
{
    private const int MaxHistoryMessages = 8; // keep last 4 turns — large history causes small models to echo stale responses
    private const int MaxToolRounds = 5; // caps chained tool calls (e.g. retry with corrected fruit name)
    private static readonly TimeSpan SessionLifetime = TimeSpan.FromMinutes(30);

    // Tool names below must exactly match the plugin-qualified names Semantic Kernel exposes
    // (PluginName_FunctionName). A mismatch here makes qwen2.5:3b silently return an empty
    // reply instead of calling anything or explaining why — it does not fuzzy-match tool names.
    private const string SystemPrompt = """
You are FalFul's fruit store assistant. Keep every reply short and direct.
You have access to these tools — use them whenever the user's question requires real data:

  FruitStore_get_available_fruits          → whole-fruit names, prices (per kg/unit), availability, stock
  FruitStore_get_cut_fruit_options         → browse which fruits support cut orders and their min/step rules
  CutFruitOrder_validate_cut_fruit_order   → price and validate a cut-fruit order when the user gives gram quantities (quote only, does NOT touch the cart)
                                            Input: JSON array [{"fruitName":"...","requestedGrams":...}]
  FruitInfo_get_fruit_info                 → nutrition or health facts for a specific fruit
  Cart_add_to_cart                         → add an item to the cart (adds to any existing quantity, never replaces).
                                            Pass the unit exactly as the user said it — "kg" or "g" — do not decide whole-vs-cut yourself.
  Cart_update_cart_item                    → set an existing cart line to an absolute new quantity (only when the user explicitly wants to change it)
  Cart_remove_from_cart                    → remove an item from the cart
  Cart_view_cart                           → show the full current cart/order (if user asks for the content of the cart)
  Cart_clear_cart                           → clears the cart if user asks to clear/remove the cart

INTENT ROUTING — decide by the UNIT WORD the user actually said, not by what was discussed earlier
(follow exactly, every turn):
- Greeting / small talk → NO tool. One-sentence reply.
- User states a quantity with a unit AND wants to order/add it ("order", "add", "extra", "also", "I want") →
  call Cart_add_to_cart with fruitName, quantity, and unit copied verbatim from the user's words
  ("kg"/"kilo" or "g"/"gram"/"grams"). Do not translate kg into a gram number or vice versa —
  pass the number and unit exactly as stated and let the tool decide pricing.
- User asks "would this cost" / "how much" / wants a quote WITHOUT committing to an order, in grams →
  call CutFruitOrder_validate_cut_fruit_order (quote only, does NOT touch the cart).
- Browsing only (no quantity, just "what fruits do you have" / prices / stock) → call FruitStore_get_available_fruits.
- Browsing cut-fruit rules (min grams, step size) → call FruitStore_get_cut_fruit_options.
  If a fruit name in a tool result says "not found", also call FruitStore_get_available_fruits to get real product names, then retry with the correct name.
- Fruit named with NO unit at all (e.g. "I want mango", "give me some watermelon") → this is AMBIGUOUS.
  Call NO tool at all. Reply with ONLY this one short clarifying question (fill in the fruit name), nothing else:
  "Would you like a whole <fruit> sold by kilogram, or a customized cut-fruit order by grams?"
- "also"/"extra"/"add"/"one more" → ADDITIVE. Call Cart_add_to_cart; never replace or re-derive the whole order from scratch.
- Explicit change to an existing cart line ("make it 2 kg instead", "change to 500g") → call Cart_update_cart_item.
- "remove"/"cancel"/"take out" an item → call Cart_remove_from_cart.
- "what's in my cart" / "my order" / "previous order" / "previous customized order" → call Cart_view_cart.
- Nutrition / vitamins / health → call FruitInfo_get_fruit_info NOW.
- Off-topic → politely decline.

CRITICAL RULES:
- NEVER answer a pricing, availability, or cart question from memory or from a previous message.
- ALWAYS call the tool on EVERY turn that asks about prices, grams, availability, cut fruit, or the cart — even if you answered the same question before.
- NEVER skip a tool call because a previous response already mentioned the item.
- The cart is the single source of truth for what the user has ordered. Do not track or restate order contents from memory —
  an authoritative cart listing is appended to your reply automatically after any Cart_* call, so you do not need to
  (and should not try to) recite cart contents yourself.

RESPONSE RULES:
- Answer ONLY what was asked. Keep it to one short sentence describing what you just did — do not list cart items
  or totals yourself; the system appends the real cart state after your reply.
- For pricing/quotes: present the tool result directly. NEVER invent quantities, prices, or totals.
- If a tool returns an "error" field or "not found", relay the exact message — do not paraphrase as "not available".
- No suggestions. No disclaimers. No extra sentences.
""";

    private readonly IChatCompletionService _chat;
    private readonly Kernel _kernel;
    private readonly IMemoryCache _cache;
    private readonly ChatSessionContext _sessionContext;

    public OllamaChatService(IChatCompletionService chat, Kernel kernel, IMemoryCache cache, ChatSessionContext sessionContext)
    {
        _chat = chat;
        _kernel = kernel;
        _cache = cache;
        _sessionContext = sessionContext;
    }

    public async Task<ChatResult> ChatAsync(
        string sessionId,
        string userMessage,
        IReadOnlyList<ChatCartItemDto>? chatCartItems,
        IReadOnlyList<ManualCartItemDto>? manualCartItems,
        CancellationToken ct = default)
    {
        _sessionContext.SessionId = sessionId;

        var history = _cache.GetOrCreate(sessionId, entry =>
        {
            entry.SlidingExpiration = SessionLifetime;
            var h = new ChatHistory();
            h.AddSystemMessage(SystemPrompt);
            return h;
        })!;

        // Trim oldest turns but always keep the system message at index 0
        while (history.Count > MaxHistoryMessages + 1)
            history.RemoveAt(1);


        var countBeforeThisAttempt = history.Count;
        history.AddUserMessage(userMessage);

      
        var settings = new PromptExecutionSettings
        {
            FunctionChoiceBehavior = FunctionChoiceBehavior.Auto(autoInvoke: false),
            // Low temperature keeps the model on-script and reduces creative drift
            ExtensionData = new Dictionary<string, object> { { "temperature", 0.1 } }
        };

        string modelReply;
        bool cartTouched;
        List<string> cartNotes;
        bool requiresCart;
        try
        {
            (modelReply, requiresCart) = await RunToolLoopAsync(history, settings, ct);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ChatAI] GetChatMessageContentsAsync failed: {ex}");
            modelReply = "Sorry, I ran into a problem processing your request. Please try again.";
            cartTouched = false;
            cartNotes = new List<string>();
            requiresCart = false;
        }

        
        string finalReply;
        ChatCartDto? cartSnapshot = null;
        //if (cartTouched)
        //{
        //    // Guaranteed non-null: reaching this branch means a Cart_* call executed this
        //    // turn, which the gate in RunToolLoopAsync only allows once hasCart is true.
        //    var cart = _sessionContext.CurrentCart ?? new Cart();
        //    var rendered = RenderCart(cart);
        //    finalReply = cartNotes.Count > 0
        //        ? $"{string.Join(" ", cartNotes.Distinct())}\n\n{rendered}"
        //        : rendered;
        //    // Snapshot is taken from the same Cart object RenderCart just read, so the
        //    // structured payload returned to the frontend can never disagree with the
        //    // text shown in the chat bubble — both come from one source of truth.
        //    cartSnapshot = cart.ToSnapshot();
        //}
        //else
        //{
        //    finalReply = modelReply;
        //}

        // Store the SAME text we show the user — never the model's raw (possibly
        // fabricated) text. Otherwise the model sees its own hallucination in history next
        // turn and builds further hallucination on top of it instead of self-correcting.
        //if (!string.IsNullOrWhiteSpace(finalReply) && history.LastOrDefault()?.Content != finalReply)
        //    history.AddAssistantMessage(finalReply);

        return new ChatResult(modelReply, true, cartSnapshot);
    }

    private static string RenderCart(Cart cart)
    {
        if (cart.Items.Count == 0 && cart.ManualItems.Count == 0)
            return "Your cart is currently empty.";

        var lines = cart.Items.Select(i =>
        {
            var qtyLabel = i.Type == CartItemType.Whole ? $"{i.Quantity} kg" : $"{i.Quantity}g (customized)";
            return $"- {qtyLabel} {i.FruitName}: ${i.LineTotal:0.00}";
        }).Concat(cart.ManualItems.Select(i =>
            $"- {i.Quantity} {i.Unit} {i.ProductName}: ${i.LineTotal:0.00}"));

        return $"Current cart:\n{string.Join("\n", lines)}\nTotal: ${cart.GrandTotal:0.00}";
    }

    // Built directly from the tool's own JSON result — never the model's phrasing — so the
    // action note shown to the user can't drift from what actually happened.
    private static string? SummarizeCartResult(string functionName, string? resultJson)
    {
        if (!string.IsNullOrWhiteSpace(resultJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(resultJson);
                if (doc.RootElement.TryGetProperty("error", out var err))
                    return err.GetString();
            }
            catch (JsonException) { /* not JSON — fall through */ }
        }

        if (functionName.Contains("add_to_cart", StringComparison.Ordinal)) return "Added to your cart.";
        if (functionName.Contains("update_cart_item", StringComparison.Ordinal)) return "Updated your cart.";
        if (functionName.Contains("remove_from_cart", StringComparison.Ordinal)) return "Removed from your cart.";
        return null; // view_cart needs no lead-in — the listing speaks for itself
    }

    private async Task<(string LLMReply, bool RequiresCart)> RunToolLoopAsync(
        ChatHistory history, PromptExecutionSettings settings, CancellationToken ct)
    {
        var cartTouched = false;
        var cartNotes = new List<string>();

            for (var round = 0; round < MaxToolRounds; round++)
            {
                var result = (await _chat.GetChatMessageContentsAsync(history, settings, _kernel, ct)).Last();

                history.Add(result);

                var functionCalls = FunctionCallContent.GetFunctionCalls(result).ToList();
                if (!functionCalls.Any())
                    return (result.Content ?? "" , false);

               

                foreach (var call in functionCalls)
                {
                    try
                    {
                        var toolResult = await call.InvokeAsync(_kernel, ct);

                        history.Add(toolResult.ToChatMessage());

                        bool iscart = 
                        call.FunctionName.StartsWith("Cart_", StringComparison.Ordinal);


                        if (iscart)
                          {
                             return (toolResult.Result?.ToString() ?? "", true);

                        } 
                    }
                    catch (Exception ex)
                    {

                        Console.WriteLine(ex);

                        var errorJson = JsonSerializer.Serialize(new
                        {
                            error = ex.Message
                        });

                        history.Add(new FunctionResultContent(call, errorJson).ToChatMessage());
                    
                    
                    }
                   
 
                }
            }
        return ("Maximaum tool Call Reached.", false);

    }
}
