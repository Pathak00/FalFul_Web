using Microsoft.SemanticKernel;
using System.Text.Json;

namespace FalFul.ChatAI;

// Wired into the Kernel via kernel.FunctionInvocationFilters. The Kernel is built
// AddScoped (once per HTTP request/turn), so this filter instance — and the dictionary
// below — is naturally scoped to a single ChatAsync call.
// Responsibilities:
//   1. Normalises JsonElement arguments to strings before invocation — SK's Ollama
//      connector stores every tool-call argument as JsonElement, but plugin functions
//      declare string/int/etc. parameters. Convert.ChangeType(JsonElement, string)
//      throws, so we do the conversion ourselves here, before SK attempts it.
//   2. Logs every function call with its arguments and result length.
//   3. De-duplicates identical Cart-mutation calls within the same turn. qwen2.5:3b
//      sometimes re-emits the exact same add_*/update_cart_item/remove_from_cart call
//      across tool-loop rounds (e.g. calling add_cut_fruit_to_cart for the same fruit
//      and grams twice), and since those functions merge additively, a repeat silently
//      inflates the cart. A genuinely new quantity for the same fruit produces a
//      different signature and still goes through normally.
public sealed class FunctionInvocationLogger : IFunctionInvocationFilter
{
    private readonly Dictionary<string, string> _cartMutationResultsThisTurn = new();

    public async Task OnFunctionInvocationAsync(
        FunctionInvocationContext context,
        Func<FunctionInvocationContext, Task> next)
    {
        // Normalise JsonElement → string so that string parameters receive the
        // JSON text rather than a JsonElement that Convert.ChangeType can't handle.
        foreach (var name in context.Arguments.Names.ToList())
        {
            if (context.Arguments[name] is JsonElement element)
            {
                context.Arguments[name] = element.ValueKind switch
                {
                    // String kind: the model passed a plain string value — unwrap it.
                    JsonValueKind.String => element.GetString() ?? "",
                    // Any other kind (Array, Object, Number…): serialise to raw JSON text.
                    _ => element.GetRawText()
                };
            }
        }

        var label = $"{context.Function.PluginName}-{context.Function.Name}";
        var args = context.Arguments
            .Where(a => a.Value is not null)
            .ToDictionary(k => k.Key, v => v.Value?.ToString() ?? "");
        var argsJson = JsonSerializer.Serialize(args);

        Console.WriteLine($"[ChatAI] >> {label}");
        Console.WriteLine($"[ChatAI]    args: {argsJson}");

        var isCartMutation = context.Function.PluginName == "Cart" && context.Function.Name != "view_cart";
        var signature = $"{label}|{argsJson}";

        if (isCartMutation && _cartMutationResultsThisTurn.TryGetValue(signature, out var cachedResult))
        {
            Console.WriteLine($"[ChatAI] == {label} duplicate call this turn — reusing prior result, not re-invoking.");
            context.Result = new FunctionResult(context.Function, cachedResult);
            return;
        }

        try
        {
            await next(context);
            var result = context.Result?.GetValue<string>();
            Console.WriteLine($"[ChatAI] << {label}");
            Console.WriteLine($"[ChatAI]    result: {result}");

            if (isCartMutation && result is not null)
                _cartMutationResultsThisTurn[signature] = result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ChatAI] !! {label} threw: {ex.GetType().Name}: {ex.Message}");
            throw;
        }
    }
}
