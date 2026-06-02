namespace FalFul.Application.DTOs.Receipt;

// Rendered receipt — returned to the client as compiled HTML
public class RenderedReceiptDto
{
    public int    OrderId      { get; set; }
    public string OrderNumber  { get; set; } = string.Empty;
    public string Html         { get; set; } = string.Empty;  // template with all {{}} replaced
    public int?   TemplateId   { get; set; }
}

// Raw order data used to fill receipt placeholders (internal use by ReceiptService)
public class OrderReceiptDataDto
{
    // Order
    public int      OrderId           { get; set; }
    public string   OrderNumber       { get; set; } = string.Empty;
    public byte     OrderStatus       { get; set; }
    public decimal  SubTotal          { get; set; }
    public decimal  DeliveryFee       { get; set; }
    public decimal  ServiceFee        { get; set; }
    public decimal  DiscountAmount    { get; set; }
    public string?  DiscountCode      { get; set; }
    public decimal  TotalAmount       { get; set; }
    public decimal  AdvanceAmount     { get; set; }
    public byte     PaymentMethod     { get; set; }
    public byte     PaymentStatus     { get; set; }
    public DateTime? DeliveryDate     { get; set; }
    public string?  DeliveryTimeSlot  { get; set; }
    public string?  CustomerNotes     { get; set; }
    public DateTime OrderDate         { get; set; }
    // Address
    public string?  DeliveryFullAddress { get; set; }
    public string?  DeliveryCity        { get; set; }
    public string?  DeliveryPhone       { get; set; }
    public string?  AddressLabel        { get; set; }
    public string?  Landmark            { get; set; }
    // Customer
    public int      CustomerId          { get; set; }
    public string   CustomerName        { get; set; } = string.Empty;
    public string   CustomerEmail       { get; set; } = string.Empty;
    public string   CustomerPhone       { get; set; } = string.Empty;
    // Delivery
    public int?     DeliveryId          { get; set; }
    public byte?    DeliveryStatus      { get; set; }
    public DateTime? ScheduledDate      { get; set; }
    public string?  ScheduledTimeSlot   { get; set; }
    public DateTime? DeliveredAt        { get; set; }
    public string?  RiderName           { get; set; }
    public string?  RiderPhone          { get; set; }
    // Rating acknowledgement
    public bool     ReceiptAcknowledged     { get; set; }
    public DateTime? ReceiptAcknowledgedAt  { get; set; }
    // Items and payments populated separately
    public List<OrderReceiptItemDto>    Items    { get; set; } = [];
    public List<OrderReceiptPaymentDto> Payments { get; set; } = [];
}

public class OrderReceiptItemDto
{
    public string   ProductName       { get; set; } = string.Empty;
    public decimal  Quantity          { get; set; }
    public string   Unit              { get; set; } = string.Empty;
    public decimal  UnitPrice         { get; set; }
    public decimal  TotalPrice        { get; set; }
    public bool     IsCustomBuild     { get; set; }
    public string?  CustomBuildDetails { get; set; }
}

public class OrderReceiptPaymentDto
{
    public string   PaymentType           { get; set; } = string.Empty;
    public decimal  Amount                { get; set; }
    public byte     Status                { get; set; }
    public string?  GatewayTransactionId  { get; set; }
    public DateTime? PaidAt              { get; set; }
}

public class ReceiptPrintLogDto
{
    public int      Id                  { get; set; }
    public int      OrderId             { get; set; }
    public string   OrderNumber         { get; set; } = string.Empty;
    public int      PrintedByUserId     { get; set; }
    public string   PrintedByName       { get; set; } = string.Empty;
    public string   PrintedByRole       { get; set; } = string.Empty;
    public DateTime PrintedAt           { get; set; }
    public int?     TemplateId          { get; set; }
    public string?  TemplateName        { get; set; }
    public int?     TemplateVersionId   { get; set; }
}

public class LogPrintDto
{
    public int?    TemplateId         { get; set; }
    public int?    TemplateVersionId  { get; set; }
    public string  Role               { get; set; } = string.Empty;
}
