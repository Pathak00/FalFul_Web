using FalFul.Application.Interfaces;
using Microsoft.SemanticKernel;
using System.ComponentModel;
using System.Text.Json;

namespace FalFul.ChatAI.Plugins;

public class CutFruitOrderPlugin(IProductRepository productRepo)
{
    private sealed record OrderItem(string FruitName, int RequestedGrams);

    [KernelFunction("validate_cut_fruit_order")]
    [Description("""
        Validates quantities and calculates the correct price for one or more cut-fruit items.
        Call this whenever the user specifies a gram quantity or requests cut/sliced fruit with an amount.
        Do NOT calculate prices or quantities yourself — always call this function and present its result exactly.
        Pass a JSON array of items. Each item needs a fruit name and the requested gram amount.
        Example: [{"fruitName":"Mango","requestedGrams":500},{"fruitName":"Apple","requestedGrams":300}]
        """)]
    public async Task<string> ValidateCutFruitOrderAsync(
        [Description(
            "JSON array where each element has a fruit name and gram quantity. " +
            "Accepted field names — name: fruitName/fruit/name/item/product; " +
            "grams: requestedGrams/grams/gram/quantity/amount/weight. " +
            "Example: [{\"fruitName\":\"Mango\",\"requestedGrams\":400}]")]
        string orderItemsJson,
        CancellationToken ct = default)
    {
        List<OrderItem> requests;
        try
        {
            requests = ParseFlexible(orderItemsJson);
        }
        catch (Exception ex)
        {
            return Err($"Could not parse order items: {ex.Message}. " +
                       "Expected JSON array, e.g. [{\"fruitName\":\"Mango\",\"requestedGrams\":400}]");
        }

        if (requests.Count == 0)
            return Err("No valid items found in the input. " +
                       "Ensure each entry has a fruit name and a gram quantity.");

        var catalog = (await productRepo.GetAllAsync(null, null)).ToList();

        var lineItems = new List<object>();
        decimal grandTotal = 0;
        int invalidCount = 0;

        // All catalog names — used in "not found" messages so the LLM knows real names.
        var catalogNames = catalog.Select(p => p.Name).ToList();

        foreach (var req in requests)
        {
            var product = CutFruitPricing.FindProduct(catalog, req.FruitName);

            if (product == null)
            {
                var available = string.Join(", ", catalogNames);
                lineItems.Add(Rejected(req.FruitName, req.RequestedGrams,
                    $"'{req.FruitName}' was not found. Available products: {available}",
                    pricePerGram: null));
                invalidCount++;
                continue;
            }

            var validation = CutFruitPricing.Validate(product, req.RequestedGrams);

            if (!validation.IsValid)
            {
                lineItems.Add(Rejected(product.Name, req.RequestedGrams, validation.Message, validation.PricePerGram));
                invalidCount++;
                continue;
            }

            grandTotal += validation.LineTotal;
            lineItems.Add(new
            {
                fruitName = product.Name,
                requestedGrams = req.RequestedGrams,
                isValid = true,
                validationMessage = "OK",
                pricePerGram = validation.PricePerGram,
                lineTotal = validation.LineTotal
            });
        }

        return JsonSerializer.Serialize(new
        {
            items = lineItems,
            summary = new
            {
                allValid = invalidCount == 0,
                grandTotal,
                note = invalidCount > 0
                    ? $"{invalidCount} item(s) rejected — see validationMessage for details."
                    : (string?)null
            }
        });
    }

    // Parses the LLM-generated JSON with tolerance for field-name variations a small model
    // might produce (snake_case, abbreviated names, numeric strings like "400g", etc.).
    // By the time this runs, FunctionInvocationLogger has already converted the JsonElement
    // argument to a plain string, so we just parse it here.
    private static List<OrderItem> ParseFlexible(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.ValueKind != JsonValueKind.Array)
            throw new FormatException($"Expected a JSON array, got {root.ValueKind}.");

        var items = new List<OrderItem>();

        foreach (var element in root.EnumerateArray())
        {
            string? name = null;
            int? grams = null;

            foreach (var prop in element.EnumerateObject())
            {
                // Normalize: lowercase, strip underscores and hyphens
                var key = prop.Name.ToLowerInvariant()
                              .Replace("_", "")
                              .Replace("-", "");

                switch (key)
                {
                    case "fruitname" or "fruit" or "name" or "item" or "product":
                        name = prop.Value.GetString();
                        break;

                    case "requestedgrams" or "grams" or "gram" or "quantity"
                         or "amount" or "weight" or "quantityingrams" or "requestedquantity":
                        grams = prop.Value.ValueKind switch
                        {
                            JsonValueKind.Number => prop.Value.GetInt32(),
                            JsonValueKind.String => TryParseGramString(prop.Value.GetString()),
                            _ => null
                        };
                        break;
                }
            }

            if (name is not null && grams.HasValue)
                items.Add(new OrderItem(name, grams.Value));
        }

        return items;
    }

    // Handles strings like "400", "400g", "400 g", "400grams"
    private static int? TryParseGramString(string? s)
    {
        if (s is null) return null;
        var clean = s.Trim().TrimEnd('s', 'g', 'G', 'r', 'a', 'm').Trim();
        return int.TryParse(clean, out var v) ? v : null;
    }

    private static object Rejected(string name, int grams, string reason, decimal? pricePerGram) => new
    {
        fruitName = name,
        requestedGrams = grams,
        isValid = false,
        validationMessage = reason,
        pricePerGram,
        lineTotal = (decimal?)null
    };

    private static string Err(string message) =>
        JsonSerializer.Serialize(new { error = message });
}
