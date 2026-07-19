namespace FalFul.Application.DTOs.ChatAI;

// Serialized straight to the frontend so the AI-driven cart can be mirrored into the
// real shopping cart (CartService in Angular) — not just shown as chat text. OrderType
// is "whole" or "cut", matching FalFul.ChatAI.CartItemType.
public sealed record ChatCartItemDto(
    int? ProductId,
    string FruitName,
    string? ProductSlug,
    string? ImageUrl,
    string OrderType,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record ChatCartDto(List<ChatCartItemDto> Items, decimal GrandTotal);

// Catalog products the customer added by browsing directly (not via chat) — unit-agnostic
// (KG, Piece, Box, Bowl, Pack, ...), supplied fresh by the client only when the assistant's
// own tool-routing decides a turn actually needs cart contents (see ChatResult.RequiresCart).
public sealed record ManualCartItemDto(
    string ProductName,
    string Unit,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal,
    int? ProductId,
    string? ProductSlug,
    string? ImageUrl);

// Cart is non-null only when this turn actually touched the cart (cartTouched) — callers
// should not infer "cart is empty" from a null Cart. RequiresCart is true when the
// assistant wanted to check/mutate the cart but the caller hadn't supplied chatCartItems/
// manualCartItems yet for this attempt — Reply is empty in that case; the caller should
// resend the same message with the current cart snapshot attached (both chat-origin and
// manually-added lines — the backend holds no cart state of its own between requests).
public sealed record ChatResult(string Reply, bool CartTouched, ChatCartDto? Cart, bool RequiresCart = false);
