using FalFul.Domain.Entities;

namespace FalFul.ChatAI;

public sealed record CutFruitValidation(bool IsValid, string Message, decimal PricePerGram, decimal LineTotal);

// Shared min/step/price validation for a single cut-fruit line, used by both the
// preview/quote path (CutFruitOrderPlugin) and the cart-mutating path (CartPlugin) so
// the two never drift apart.
public static class CutFruitPricing
{
    public static CutFruitValidation Validate(Product product, int grams)
    {
        if (!product.IsAvailable)
            return new(false, $"{product.Name} is currently unavailable.", 0m, 0m);

        if (product.CutFruitPrice is null || product.MinOrderGrams is null || product.GramStep is null)
            return new(false, $"{product.Name} is not offered as cut fruit.", 0m, 0m);

        var min = product.MinOrderGrams.Value;
        var step = product.GramStep.Value;
        var pricePerGram = product.CutFruitPrice.Value / min;

        if (grams <= 0)
            return new(false, $"Quantity must be greater than 0. Minimum is {min}g.", pricePerGram, 0m);

        if (grams < min)
            return new(false, $"{grams}g is below the minimum of {min}g.", pricePerGram, 0m);

        if ((grams - min) % step != 0)
        {
            var stepsBelow = (grams - min) / step;
            var lower = min + stepsBelow * step;
            var upper = lower + step;
            return new(false,
                $"{grams}g is not valid. Nearest options: {lower}g or {upper}g. (Min: {min}g, step: {step}g)",
                pricePerGram, 0m);
        }

        var lineTotal = Math.Round(pricePerGram * grams, 2, MidpointRounding.AwayFromZero);
        return new(true, "OK", pricePerGram, lineTotal);
    }

    // Exact match first, then partial ("Fresh Mango" <-> "Mango") so the model doesn't
    // need to know the precise DB product name. Falls back to a space-insensitive
    // comparison so "Watermelon" still matches a DB product named "water melon".
    public static Product? FindProduct(IEnumerable<Product> catalog, string fruitName)
    {
        var products = catalog as IList<Product> ?? catalog.ToList();

        var exact = products.FirstOrDefault(p => p.Name.Equals(fruitName, StringComparison.OrdinalIgnoreCase));
        if (exact != null) return exact;

        var partial = products.FirstOrDefault(p =>
            p.Name.Contains(fruitName, StringComparison.OrdinalIgnoreCase) ||
            fruitName.Contains(p.Name, StringComparison.OrdinalIgnoreCase));
        if (partial != null) return partial;

        var normalizedTarget = Normalize(fruitName);
        return products.FirstOrDefault(p =>
        {
            var normalizedName = Normalize(p.Name);
            return normalizedName.Contains(normalizedTarget) || normalizedTarget.Contains(normalizedName);
        });
    }

    private static string Normalize(string s) => s.Replace(" ", "").Replace("-", "").ToLowerInvariant();
}
