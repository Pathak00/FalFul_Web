using FalFul.Domain.Enums;

namespace FalFul.Domain.Entities;

public class Order
{
    public int           Id                { get; set; }
    public int           UserId            { get; set; }
    public string        CustomerName      { get; set; } = string.Empty;
    public string        OrderNumber       { get; set; } = string.Empty;
    public OrderStatus   Status            { get; set; }
    public decimal       SubTotal          { get; set; }
    public decimal       DeliveryFee       { get; set; }
    public decimal       ServiceFee        { get; set; }
    public decimal       DiscountAmount    { get; set; }
    public string?       DiscountCode      { get; set; }
    public decimal       TotalAmount       { get; set; }
    public decimal       AdvanceAmount     { get; set; }
    public PaymentMethod PaymentMethod     { get; set; }
    public PaymentStatus PaymentStatus     { get; set; }
    public int?          DeliveryAddressId { get; set; }
    public int           ItemCount         { get; set; }
    public string        FullAddress       { get; set; } = string.Empty;
    public string        City              { get; set; } = string.Empty;
    public string        DeliveryPhone     { get; set; } = string.Empty;
    public string?       AddressLabel      { get; set; }
    public string?       Landmark          { get; set; }
    public DateOnly      DeliveryDate      { get; set; }
    public string        DeliveryTimeSlot  { get; set; } = string.Empty;
    public string?       Notes             { get; set; }
    public string?       CancelReason      { get; set; }
    public double?       DeliveryLatitude  { get; set; }
    public double?       DeliveryLongitude { get; set; }
    public DateTime      CreatedAt         { get; set; }
    public DateTime?     UpdatedAt         { get; set; }

    public byte?           DeliveryStatus { get; set; }

    public List<OrderItem> Items    { get; set; } = [];
    public Delivery?       Delivery { get; set; }
}

public class OrderItem
{
    public int      Id                 { get; set; }
    public int      OrderId            { get; set; }
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
