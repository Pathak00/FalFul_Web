namespace FalFul.Application.DTOs.Order;

public class DeliveryReportDto
{
    public int     TotalDeliveries { get; set; }
    public int     Delivered       { get; set; }
    public int     Failed          { get; set; }
    public int     Rescheduled     { get; set; }
    public int     InProgress      { get; set; }
    public decimal SuccessRate     { get; set; }
    public decimal AvgAttempts     { get; set; }
    public decimal? AvgRating      { get; set; }
    public List<FailureReasonBreakdownDto> FailureBreakdown { get; set; } = [];
    public List<StatusBreakdownDto>        StatusBreakdown  { get; set; } = [];
}

public class FailureReasonBreakdownDto
{
    public byte   FailureReason      { get; set; }
    public string FailureReasonLabel { get; set; } = string.Empty;
    public int    Count              { get; set; }
}

public class StatusBreakdownDto
{
    public byte   Status      { get; set; }
    public string StatusLabel { get; set; } = string.Empty;
    public int    Count       { get; set; }
}

public class OrderReportDto
{
    public int     TotalOrders      { get; set; }
    public int     Delivered        { get; set; }
    public int     Cancelled        { get; set; }
    public int     Active           { get; set; }
    public decimal TotalRevenue     { get; set; }
    public decimal AvgOrderValue    { get; set; }
    public decimal DeliveredRevenue { get; set; }
    public List<OrderStatusBreakdownDto>   StatusBreakdown  { get; set; } = [];
    public List<PaymentMethodBreakdownDto> PaymentBreakdown { get; set; } = [];
}

public class OrderStatusBreakdownDto
{
    public byte    Status      { get; set; }
    public string  StatusLabel { get; set; } = string.Empty;
    public int     Count       { get; set; }
    public decimal Revenue     { get; set; }
}

public class PaymentMethodBreakdownDto
{
    public byte    PaymentMethod      { get; set; }
    public string  PaymentMethodLabel { get; set; } = string.Empty;
    public int     Count              { get; set; }
    public decimal Revenue            { get; set; }
}
