using FalFul.Application.DTOs.ChatAI;
using System.Text.Json;

namespace FalFul.ChatAI;

public enum CartItemType { Whole, Cut }

public sealed record CartItem(
    string FruitName,
    CartItemType Type,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal,
    int? ProductId = null,
    string? ProductSlug = null,
    string? ImageUrl = null);

// Catalog products added by browsing directly (not via chat) — unit-agnostic (KG, Piece,
// Box, Bowl, Pack, ...) unlike CartItem, which is tied to the Whole(kg)/Cut(g) pricing
// model chat ordering tools use. Supplied fresh by the client each time it's needed (see
// Cart.ReplaceManualItems) rather than incrementally maintained server-side.
public sealed record ManualCartItem(
    string ProductName,
    string Unit,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal,
    int? ProductId = null,
    string? ProductSlug = null,
    string? ImageUrl = null);

public sealed class Cart
{
    public static bool TryParseType(string? orderType, out CartItemType type)
    {
        switch (orderType?.Trim().ToLowerInvariant())
        {
            case "whole": type = CartItemType.Whole; return true;
            case "cut": type = CartItemType.Cut; return true;
            default: type = default; return false;
        }
    }

    public List<CartItem> Items { get; } = new();
    public List<ManualCartItem> ManualItems { get; private set; } = new();

    public decimal GrandTotal => Items.Sum(i => i.LineTotal) + ManualItems.Sum(i => i.LineTotal);

    public void ReplaceManualItems(IEnumerable<ManualCartItem> items) => ManualItems = items.ToList();

    public void AddOrMerge(
        string fruitName, CartItemType type, decimal quantity, decimal unitPrice,
        int? productId = null, string? productSlug = null, string? imageUrl = null)
    {
        var existingIndex = Items.FindIndex(i =>
            i.Type == type && i.FruitName.Equals(fruitName, StringComparison.OrdinalIgnoreCase));

        if (existingIndex >= 0)
        {
            var existing = Items[existingIndex];
            var newQuantity = existing.Quantity + quantity;
            Items[existingIndex] = existing with
            {
                Quantity = newQuantity,
                UnitPrice = unitPrice,
                LineTotal = Math.Round(unitPrice * newQuantity, 2, MidpointRounding.AwayFromZero),
                ProductId = productId ?? existing.ProductId,
                ProductSlug = productSlug ?? existing.ProductSlug,
                ImageUrl = imageUrl ?? existing.ImageUrl
            };
        }
        else
        {
            Items.Add(new CartItem(fruitName, type, quantity, unitPrice,
                Math.Round(unitPrice * quantity, 2, MidpointRounding.AwayFromZero),
                productId, productSlug, imageUrl));
        }
    }

    public bool SetQuantity(string fruitName, CartItemType type, decimal newQuantity)
    {
        var index = Items.FindIndex(i =>
            i.Type == type && i.FruitName.Equals(fruitName, StringComparison.OrdinalIgnoreCase));
        if (index < 0) return false;

        var existing = Items[index];
        Items[index] = existing with
        {
            Quantity = newQuantity,
            LineTotal = Math.Round(existing.UnitPrice * newQuantity, 2, MidpointRounding.AwayFromZero)
        };
        return true;
    }

    public List<CartItemType> FindTypes(string fruitName) =>
        Items.Where(i => i.FruitName.Equals(fruitName, StringComparison.OrdinalIgnoreCase))
             .Select(i => i.Type)
             .Distinct()
             .ToList();

    // orderType: null removes the item regardless of type (only safe when the name is unambiguous).
    public bool Remove(string fruitName, CartItemType? type)
    {
        var index = Items.FindIndex(i =>
            i.FruitName.Equals(fruitName, StringComparison.OrdinalIgnoreCase) &&
            (type is null || i.Type == type));
        if (index < 0) return false;

        Items.RemoveAt(index);
        return true;
    }

    public string ToJson() => JsonSerializer.Serialize(new
    {
        items = Items.Select(i => new
        {
            fruitName = i.FruitName,
            orderType = i.Type.ToString().ToLowerInvariant(),
            quantity = i.Quantity,
            unitPrice = i.UnitPrice,
            lineTotal = i.LineTotal
        }),
        manualItems = ManualItems.Select(i => new
        {
            productName = i.ProductName,
            unit = i.Unit,
            quantity = i.Quantity,
            unitPrice = i.UnitPrice,
            lineTotal = i.LineTotal
        }),
        grandTotal = GrandTotal
    });

    // Typed snapshot for the API response (as opposed to ToJson(), which is the loose
    // shape fed back to the LLM as a tool result) — this is what the frontend maps into
    // its own CartItem shape to sync the real shopping cart.
    public ChatCartDto ToSnapshot() => new(
        Items.Select(i => new ChatCartItemDto(
            i.ProductId,
            i.FruitName,
            i.ProductSlug,
            i.ImageUrl,
            i.Type.ToString().ToLowerInvariant(),
            i.Quantity,
            i.UnitPrice,
            i.LineTotal)).ToList(),
        GrandTotal);
}
