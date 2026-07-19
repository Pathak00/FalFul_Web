using FalFul.Application.Interfaces;
using Microsoft.SemanticKernel;
using System.ComponentModel;
using System.Text.Json;

namespace FalFul.ChatAI.Plugins;

public class CartPlugin(IProductRepository productRepo, ChatSessionContext sessionContext)
{
    private Cart GetCart() => sessionContext.CurrentCart
        ?? throw new InvalidOperationException("No cart available for this request.");

    [KernelFunction("add_to_cart")]
    [Description("""
        Adds an item to the current order. Do NOT decide whole-vs-cut yourself — just copy
        the unit word the user actually said into the "unit" argument, exactly as typed:
          - "kg"/"kilogram"/"kilo" → priced as whole fruit, quantity is a kg amount (e.g. 1, 2.5)
          - "g"/"gram"/"grams"    → priced as customized/cut fruit, quantity is a gram amount (e.g. 400)
        If the user did NOT state a unit at all, do NOT call this function — ask whether they
        want whole fruit (kg) or a customized/cut order (grams) instead.
        If the same fruit + unit is already in the cart, the quantity is ADDED to that line —
        it does not replace the order.
        """)]
    public async Task<string> AddToCartAsync(
        [Description("The fruit name, e.g. Mango")] string fruitName,
        [Description("The quantity number the user said, e.g. 1 or 400")] decimal quantity,
        [Description("The unit word exactly as the user said it: \"kg\" or \"g\"")] string unit,
        CancellationToken ct = default)
    {
        if (quantity <= 0)
            return Err("Quantity must be greater than 0.");

        var normalizedUnit = unit.Trim().TrimEnd('s').ToLowerInvariant();
        var isWhole = normalizedUnit is "kg" or "kilogram" or "kilo";
        var isCut = normalizedUnit is "g" or "gram" or "gm";

        if (!isWhole && !isCut)
            return Err($"Unrecognized unit '{unit}'. Use \"kg\" for whole fruit or \"g\" for customized/cut fruit.");

        var catalog = (await productRepo.GetAllAsync(null, null)).ToList();
        var product = CutFruitPricing.FindProduct(catalog, fruitName);

        if (product == null)
        {
            var available = string.Join(", ", catalog.Select(p => p.Name));
            return Err($"'{fruitName}' was not found. Available products: {available}");
        }

        var cart = GetCart();

        if (isWhole)
        {
            if (!product.IsAvailable)
                return Err($"{product.Name} is currently unavailable.");

            cart.AddOrMerge(product.Name, CartItemType.Whole, quantity, product.Price,
                product.Id, product.Slug, product.ImageUrl);
            return cart.ToJson();
        }

        var validation = CutFruitPricing.Validate(product, (int)quantity);
        if (!validation.IsValid)
            return Err(validation.Message);

        cart.AddOrMerge(product.Name, CartItemType.Cut, quantity, validation.PricePerGram,
            product.Id, product.Slug, product.ImageUrl);
        return cart.ToJson();
    }

    [KernelFunction("update_cart_item")]
    [Description("""
        Sets an existing cart line to an absolute new quantity (kg for whole-fruit, grams for cut-fruit).
        Use this only when the user explicitly wants to CHANGE a quantity already in the cart
        (e.g. "make my mango 2 kg instead"), not for adding more of something.
        orderType ("whole" or "cut") is optional if the fruit only appears once in the cart.
        """)]
    public async Task<string> UpdateCartItemAsync(
        [Description("The fruit name")] string fruitName,
        [Description("\"whole\" or \"cut\" — optional if the fruit only appears once")] string? orderType,
        [Description("New absolute quantity (kg for whole, grams for cut)")] decimal newQuantity,
        CancellationToken ct = default)
    {
        var cart = GetCart();
        CartItemType type;

        if (string.IsNullOrWhiteSpace(orderType))
        {
            var matchingTypes = cart.FindTypes(fruitName);
            if (matchingTypes.Count == 0)
                return Err($"'{fruitName}' is not in the cart.");
            if (matchingTypes.Count > 1)
                return Err($"'{fruitName}' is in the cart as both whole and cut items — specify orderType (\"whole\" or \"cut\").");
            type = matchingTypes[0];
        }
        else if (!Cart.TryParseType(orderType, out type))
        {
            return Err("orderType must be \"whole\" or \"cut\".");
        }

        if (type == CartItemType.Cut)
        {
            var catalog = (await productRepo.GetAllAsync(null, null)).ToList();
            var product = CutFruitPricing.FindProduct(catalog, fruitName);
            if (product == null)
                return Err($"'{fruitName}' was not found.");

            var validation = CutFruitPricing.Validate(product, (int)newQuantity);
            if (!validation.IsValid)
                return Err(validation.Message);
        }

        if (!cart.SetQuantity(fruitName, type, newQuantity))
            return Err($"'{fruitName}' ({type}) is not in the cart.");

        return cart.ToJson();
    }

    [KernelFunction("remove_from_cart")]
    [Description("Removes an item from the current order. orderType (\"whole\" or \"cut\") is optional if the fruit only appears once.")]
    public string RemoveFromCart(
        [Description("The fruit name")] string fruitName,
        [Description("\"whole\" or \"cut\" — optional")] string? orderType = null)
    {
        CartItemType? type = null;
        if (!string.IsNullOrWhiteSpace(orderType))
        {
            if (!Cart.TryParseType(orderType, out var parsed))
                return Err("orderType must be \"whole\" or \"cut\".");
            type = parsed;
        }

        var cart = GetCart();
        if (!cart.Remove(fruitName, type))
            return Err($"'{fruitName}' is not in the cart.");

        return cart.ToJson();
    }

    [KernelFunction("view_cart")]
    [Description("Returns the full current order/cart contents. Call this for \"what's in my cart\", \"my order\", or \"previous order\" questions.")]
    public string ViewCart() => GetCart().ToJson();

    private static string Err(string message) => JsonSerializer.Serialize(new { error = message });
}
