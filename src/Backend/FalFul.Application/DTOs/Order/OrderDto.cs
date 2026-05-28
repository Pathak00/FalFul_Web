using FalFul.Domain.Enums;

namespace FalFul.Application.DTOs.Order;

// ── Inbound (place order) ────────────────────────────────────────────────────

public class PlaceOrderItemDto
{
    public int?     ProductId          { get; set; }
    public string   ProductName        { get; set; } = string.Empty;
    public string?  ProductSlug        { get; set; }
    public string?  ImageUrl           { get; set; }
    public decimal  UnitPrice          { get; set; }
    public decimal  Quantity           { get; set; }
    public string   Unit               { get; set; } = "KG";
    public decimal  TotalPrice         { get; set; }
    public bool     IsCustomBuild      { get; set; }
    public string?  CustomBuildDetails { get; set; }
}

public class PlaceOrderDto
{
    public int                      DeliveryAddressId { get; set; }
    public string                   FullAddress       { get; set; } = string.Empty;
    public string                   City              { get; set; } = string.Empty;
    public string                   DeliveryPhone     { get; set; } = string.Empty;
    public string?                  AddressLabel      { get; set; }
    public string?                  Landmark          { get; set; }
    public DateOnly                 DeliveryDate      { get; set; }
    public string                   DeliveryTimeSlot  { get; set; } = string.Empty;
    public PaymentMethod            PaymentMethod     { get; set; }
    public string?                  Notes             { get; set; }
    public double?                  DeliveryLatitude  { get; set; }
    public double?                  DeliveryLongitude { get; set; }
    public List<PlaceOrderItemDto>  Items             { get; set; } = [];
}

// ── Outbound ─────────────────────────────────────────────────────────────────

public class OrderItemDto
{
    public int      Id                 { get; set; }
    public int      OrderId            { get; set; }
    public int?     ProductId          { get; set; }
    public string   ProductName        { get; set; } = string.Empty;
    public string?  ProductSlug        { get; set; }
    public string?  ImageUrl           { get; set; }
    public decimal  UnitPrice          { get; set; }
    public decimal  Quantity           { get; set; }
    public string   Unit               { get; set; } = string.Empty;
    public decimal  TotalPrice         { get; set; }
    public bool     IsCustomBuild      { get; set; }
    public string?  CustomBuildDetails { get; set; }
}

public class DeliveryStatusDto
{
    public int       Id                { get; set; }
    public byte      Status            { get; set; }
    public string    StatusLabel       { get; set; } = string.Empty;
    public DateOnly  ScheduledDate     { get; set; }
    public string    ScheduledTimeSlot { get; set; } = string.Empty;
    public string?   RiderName         { get; set; }
    public string?   RiderPhone        { get; set; }
    public DateTime? AssignedAt        { get; set; }
    public DateTime? PickedUpAt        { get; set; }
    public DateTime? DeliveredAt       { get; set; }
    public DateTime? FailedAt          { get; set; }
    public byte      AttemptCount      { get; set; }
    public byte      MaxAttempts       { get; set; }
    public string?   TrackingNotes     { get; set; }
    public List<DeliveryAttemptDto> Attempts { get; set; } = [];
}

public class OrderSummaryDto
{
    public int           Id               { get; set; }
    public string        OrderNumber      { get; set; } = string.Empty;
    public OrderStatus   Status           { get; set; }
    public string        StatusLabel      { get; set; } = string.Empty;
    public decimal       SubTotal         { get; set; }
    public decimal       DeliveryFee      { get; set; }
    public decimal       ServiceFee       { get; set; }
    public decimal       TotalAmount      { get; set; }
    public PaymentMethod PaymentMethod    { get; set; }
    public PaymentStatus PaymentStatus    { get; set; }
    public DateOnly      DeliveryDate     { get; set; }
    public string        DeliveryTimeSlot { get; set; } = string.Empty;
    public string        FullAddress      { get; set; } = string.Empty;
    public string        City             { get; set; } = string.Empty;
    public int           ItemCount        { get; set; }
    public DateTime      CreatedAt        { get; set; }
}

public class OrderDetailDto : OrderSummaryDto
{
    public string   CustomerName  { get; set; } = string.Empty;
    public string   DeliveryPhone { get; set; } = string.Empty;
    public string?  AddressLabel  { get; set; }
    public string?  Landmark      { get; set; }
    public string?  Notes         { get; set; }
    public string?  CancelReason  { get; set; }
    public DateTime? UpdatedAt    { get; set; }

    public List<OrderItemDto>     Items    { get; set; } = [];
    public DeliveryStatusDto?     Delivery { get; set; }
    public OrderRatingResponseDto? Rating  { get; set; }
}

// ── Admin update ─────────────────────────────────────────────────────────────

public class UpdateOrderStatusDto
{
    public OrderStatus Status  { get; set; }
    public string?     Reason  { get; set; }  // Required for Cancelled(5) and Rejected(6)
}

public class CancelOrderDto
{
    public string CancelReason { get; set; } = string.Empty;
}
