using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using FalFul.Domain.Enums;

namespace FalFul.Application.Services;

public class OrderService(
    IAddressRepository   addresses,
    IOrderRepository     orders,
    IDeliveryRepository  deliveries,
    IPriceRuleRepository priceRules,
    IOrderRatingRepository ratings) : IOrderService
{
    // ── Addresses ─────────────────────────────────────────────────────────────

    public async Task<IEnumerable<AddressDto>> GetAddressesAsync(int userId)
    {
        var list = await addresses.GetByUserAsync(userId);
        return list.Select(MapAddress);
    }

    public async Task<Result<int>> CreateAddressAsync(int userId, CreateAddressDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullAddress)) return Result<int>.Failure("Address is required.");
        if (string.IsNullOrWhiteSpace(dto.City))        return Result<int>.Failure("City is required.");
        if (string.IsNullOrWhiteSpace(dto.PhoneNumber)) return Result<int>.Failure("Phone number is required.");

        var entity = new Address
        {
            UserId      = userId,
            Label       = dto.Label.Trim(),
            FullAddress = dto.FullAddress.Trim(),
            City        = dto.City.Trim(),
            Landmark    = dto.Landmark?.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            IsDefault   = dto.IsDefault
        };

        try { var id = await addresses.CreateAsync(entity); return Result<int>.Success(id); }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
    }

    public async Task<Result> UpdateAddressAsync(int id, int userId, UpdateAddressDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullAddress)) return Result.Failure("Address is required.");
        if (string.IsNullOrWhiteSpace(dto.City))        return Result.Failure("City is required.");
        if (string.IsNullOrWhiteSpace(dto.PhoneNumber)) return Result.Failure("Phone number is required.");

        var existing = await addresses.GetByIdAsync(id);
        if (existing is null || existing.UserId != userId) return Result.Failure("Address not found.");

        existing.Label       = dto.Label.Trim();
        existing.FullAddress = dto.FullAddress.Trim();
        existing.City        = dto.City.Trim();
        existing.Landmark    = dto.Landmark?.Trim();
        existing.PhoneNumber = dto.PhoneNumber.Trim();
        existing.IsDefault   = dto.IsDefault;

        try { await addresses.UpdateAsync(existing); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteAddressAsync(int id, int userId)
    {
        var existing = await addresses.GetByIdAsync(id);
        if (existing is null || existing.UserId != userId) return Result.Failure("Address not found.");

        await addresses.DeleteAsync(id, userId);
        return Result.Success();
    }

    // ── Price Rules ───────────────────────────────────────────────────────────

    public async Task<IEnumerable<PriceRuleDto>> GetPriceRulesAsync()
    {
        var list = await priceRules.GetAllAsync();
        return list.Select(MapPriceRule);
    }

    public async Task<Result> UpsertPriceRuleAsync(UpsertPriceRuleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RuleKey)) return Result.Failure("RuleKey is required.");
        if (dto.Value < 0)                           return Result.Failure("Value cannot be negative.");

        try { await priceRules.UpsertAsync(dto.RuleKey.Trim(), dto.Value, dto.IsActive); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    public async Task<Result<string>> PlaceOrderAsync(int userId, string customerName, PlaceOrderDto dto)
    {
        if (dto.Items.Count == 0)                            return Result<string>.Failure("Cart is empty.");
        if (string.IsNullOrWhiteSpace(dto.FullAddress))      return Result<string>.Failure("Delivery address is required.");
        if (string.IsNullOrWhiteSpace(dto.DeliveryPhone))    return Result<string>.Failure("Delivery phone is required.");
        if (string.IsNullOrWhiteSpace(dto.DeliveryTimeSlot)) return Result<string>.Failure("Delivery time slot is required.");
        if (dto.DeliveryDate == default)                     return Result<string>.Failure("Delivery date is required.");

        var rules        = (await priceRules.GetAllAsync()).ToDictionary(r => r.RuleKey, r => r);
        var subTotal     = dto.Items.Sum(i => i.TotalPrice);
        var deliveryFee  = GetRuleValue(rules, "delivery_fee");
        var serviceFeePct = GetRuleValue(rules, "service_fee_percent");
        var minOrder     = GetRuleValue(rules, "min_order_amount");
        var freeAbove    = GetRuleValue(rules, "free_delivery_above");

        if (minOrder > 0 && subTotal < minOrder)
            return Result<string>.Failure($"Minimum order amount is Rs. {minOrder}.");

        if (freeAbove > 0 && subTotal >= freeAbove)
            deliveryFee = 0;

        var serviceFee  = serviceFeePct > 0 ? Math.Round(subTotal * serviceFeePct / 100, 2) : 0;
        var totalAmount = subTotal + deliveryFee + serviceFee;

        var order = new Order
        {
            UserId            = userId,
            CustomerName      = customerName,
            Status            = OrderStatus.Pending,
            SubTotal          = subTotal,
            DeliveryFee       = deliveryFee,
            ServiceFee        = serviceFee,
            TotalAmount       = totalAmount,
            PaymentMethod     = dto.PaymentMethod,
            PaymentStatus     = PaymentStatus.Pending,
            DeliveryAddressId = dto.DeliveryAddressId > 0 ? dto.DeliveryAddressId : (int?)null,
            FullAddress       = dto.FullAddress.Trim(),
            City              = dto.City.Trim(),
            DeliveryPhone     = dto.DeliveryPhone.Trim(),
            AddressLabel      = dto.AddressLabel?.Trim(),
            Landmark          = dto.Landmark?.Trim(),
            DeliveryDate      = dto.DeliveryDate,
            DeliveryTimeSlot  = dto.DeliveryTimeSlot.Trim(),
            Notes             = dto.Notes?.Trim()
        };

        try
        {
            var (orderId, orderNumber) = await orders.CreateAsync(order);

            foreach (var item in dto.Items)
            {
                await orders.AddItemAsync(new OrderItem
                {
                    OrderId            = orderId,
                    ProductId          = item.ProductId,
                    ProductName        = item.ProductName,
                    ProductSlug        = item.ProductSlug,
                    ImageUrl           = item.ImageUrl,
                    UnitPrice          = item.UnitPrice,
                    Quantity           = item.Quantity,
                    Unit               = item.Unit,
                    TotalPrice         = item.TotalPrice,
                    IsCustomBuild      = item.IsCustomBuild,
                    CustomBuildDetails = item.CustomBuildDetails
                });
            }

            // Delivery record is NOT created at order placement.
            // It is created when admin transitions the order to ReadyForDelivery(4).

            return Result<string>.Success(orderNumber);
        }
        catch (Exception ex) { return Result<string>.Failure(ex.Message); }
    }

    public async Task<IEnumerable<OrderSummaryDto>> GetUserOrdersAsync(int userId)
    {
        var list = await orders.GetByUserAsync(userId);
        return list.Select(MapSummary);
    }

    public async Task<OrderDetailDto?> GetOrderByIdAsync(int id, int? userId = null)
    {
        var order = await orders.GetByIdAsync(id);
        if (order is null) return null;
        if (userId.HasValue && order.UserId != userId.Value) return null;
        var dto    = MapDetail(order);
        var rating = await ratings.GetByOrderAsync(id);
        if (rating is not null)
            dto.Rating = new OrderRatingResponseDto
            {
                Id                   = rating.Id,
                DeliveryRating       = rating.DeliveryRating,
                ProductQualityRating = rating.ProductQualityRating,
                OverallRating        = rating.OverallRating,
                Comment              = rating.Comment,
                CreatedAt            = rating.CreatedAt
            };
        return dto;
    }

    public async Task<Result> CancelOrderAsync(int id, int userId, CancelOrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CancelReason)) return Result.Failure("Cancel reason is required.");

        var order = await orders.GetByIdAsync(id);
        if (order is null || order.UserId != userId) return Result.Failure("Order not found.");

        // Customers may cancel only while Pending(1) or Confirmed(2) — before preparation begins
        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Confirmed)
            return Result.Failure("Order cannot be cancelled at this stage.");

        try { await orders.CancelAsync(id, userId, dto.CancelReason.Trim()); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<IEnumerable<OrderSummaryDto>> GetAllOrdersAsync(byte? status = null)
    {
        var list = await orders.GetAllAsync(status);
        return list.Select(MapSummary);
    }

    public async Task<Result> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto dto)
    {
        var order = await orders.GetByIdAsync(id);
        if (order is null) return Result.Failure("Order not found.");

        if ((dto.Status == OrderStatus.Cancelled || dto.Status == OrderStatus.Rejected)
            && string.IsNullOrWhiteSpace(dto.Reason))
            return Result.Failure("A reason is required when cancelling or rejecting an order.");

        try
        {
            await orders.UpdateStatusAsync(id, dto.Status, dto.Reason?.Trim());

            // When order is marked ReadyForDelivery, create the delivery record.
            // Delivery module is responsible from this point forward.
            if (dto.Status == OrderStatus.ReadyForDelivery && order.Delivery is null)
            {
                await deliveries.CreateAsync(new Delivery
                {
                    OrderId           = id,
                    Status            = DeliveryStatus.AwaitingRider,
                    ScheduledDate     = order.DeliveryDate,
                    ScheduledTimeSlot = order.DeliveryTimeSlot
                });
            }

            return Result.Success();
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static decimal GetRuleValue(Dictionary<string, PriceRule> rules, string key)
        => rules.TryGetValue(key, out var r) && r.IsActive ? r.Value : 0;

    private static string DeliveryStatusLabel(byte s)
        => DeliveryService.DeliveryStatusLabel(s);

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static AddressDto MapAddress(Address a) => new()
    {
        Id = a.Id, UserId = a.UserId, Label = a.Label, FullAddress = a.FullAddress,
        City = a.City, Landmark = a.Landmark, PhoneNumber = a.PhoneNumber,
        IsDefault = a.IsDefault, CreatedAt = a.CreatedAt
    };

    private static PriceRuleDto MapPriceRule(PriceRule r) => new()
    {
        Id = r.Id, RuleKey = r.RuleKey, RuleName = r.RuleName,
        Value = r.Value, Unit = r.Unit, IsActive = r.IsActive, UpdatedAt = r.UpdatedAt
    };

    private static OrderSummaryDto MapSummary(Order o) => new()
    {
        Id               = o.Id,
        OrderNumber      = o.OrderNumber,
        Status           = o.Status,
        StatusLabel      = o.Status.ToString(),
        SubTotal         = o.SubTotal,
        DeliveryFee      = o.DeliveryFee,
        ServiceFee       = o.ServiceFee,
        TotalAmount      = o.TotalAmount,
        PaymentMethod    = o.PaymentMethod,
        PaymentStatus    = o.PaymentStatus,
        DeliveryDate     = o.DeliveryDate,
        DeliveryTimeSlot = o.DeliveryTimeSlot,
        FullAddress      = o.FullAddress,
        City             = o.City,
        ItemCount        = o.ItemCount > 0 ? o.ItemCount : o.Items.Count,
        CreatedAt        = o.CreatedAt
    };

    private static OrderDetailDto MapDetail(Order o) => new()
    {
        Id               = o.Id,
        OrderNumber      = o.OrderNumber,
        Status           = o.Status,
        StatusLabel      = o.Status.ToString(),
        SubTotal         = o.SubTotal,
        DeliveryFee      = o.DeliveryFee,
        ServiceFee       = o.ServiceFee,
        TotalAmount      = o.TotalAmount,
        PaymentMethod    = o.PaymentMethod,
        PaymentStatus    = o.PaymentStatus,
        DeliveryDate     = o.DeliveryDate,
        DeliveryTimeSlot = o.DeliveryTimeSlot,
        FullAddress      = o.FullAddress,
        City             = o.City,
        ItemCount        = o.Items.Count,
        CreatedAt        = o.CreatedAt,
        CustomerName     = o.CustomerName,
        DeliveryPhone    = o.DeliveryPhone,
        AddressLabel     = o.AddressLabel,
        Landmark         = o.Landmark,
        Notes            = o.Notes,
        CancelReason     = o.CancelReason,
        UpdatedAt        = o.UpdatedAt,
        Items            = o.Items.Select(i => new OrderItemDto
        {
            Id = i.Id, OrderId = i.OrderId, ProductId = i.ProductId,
            ProductName = i.ProductName, ProductSlug = i.ProductSlug,
            ImageUrl = i.ImageUrl, UnitPrice = i.UnitPrice,
            Quantity = i.Quantity, Unit = i.Unit, TotalPrice = i.TotalPrice,
            IsCustomBuild = i.IsCustomBuild, CustomBuildDetails = i.CustomBuildDetails
        }).ToList(),
        Delivery = o.Delivery is null ? null : new DeliveryStatusDto
        {
            Id                = o.Delivery.Id,
            Status            = (byte)o.Delivery.Status,
            StatusLabel       = DeliveryStatusLabel((byte)o.Delivery.Status),
            ScheduledDate     = o.Delivery.ScheduledDate,
            ScheduledTimeSlot = o.Delivery.ScheduledTimeSlot,
            RiderName         = o.Delivery.RiderName,
            RiderPhone        = o.Delivery.RiderPhone,
            AssignedAt        = o.Delivery.AssignedAt,
            PickedUpAt        = o.Delivery.PickedUpAt,
            DeliveredAt       = o.Delivery.DeliveredAt,
            FailedAt          = o.Delivery.FailedAt,
            AttemptCount      = o.Delivery.AttemptCount,
            MaxAttempts       = o.Delivery.MaxAttempts,
            TrackingNotes     = o.Delivery.TrackingNotes,
            Attempts          = o.Delivery.Attempts.Select(a => new DeliveryAttemptDto
            {
                Id                  = a.Id,
                AttemptNumber       = a.AttemptNumber,
                AttemptedAt         = a.AttemptedAt,
                WasSuccessful       = a.WasSuccessful,
                FailureReason       = a.FailureReason,
                FailureReasonLabel  = DeliveryService.FailureReasonLabelStatic(a.FailureReason),
                FailureNotes        = a.FailureNotes,
                NextAction          = a.NextAction,
                RescheduledDate     = a.RescheduledDate?.ToString("yyyy-MM-dd"),
                RescheduledTimeSlot = a.RescheduledTimeSlot
            }).ToList()
        }
    };
}
