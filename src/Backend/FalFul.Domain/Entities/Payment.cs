using FalFul.Domain.Enums;

namespace FalFul.Domain.Entities;

public class Payment
{
    public int           Id                   { get; set; }
    public int           OrderId              { get; set; }
    public byte          PaymentMethodId      { get; set; }
    public PaymentType   PaymentType          { get; set; }
    public decimal       Amount               { get; set; }
    public PaymentStatus Status               { get; set; }
    public string?       GatewayTransactionId { get; set; }
    public string?       GatewayResponse      { get; set; }
    public DateTime?     PaidAt               { get; set; }
    public DateTime      CreatedAt            { get; set; }
    public DateTime?     UpdatedAt            { get; set; }

    // Populated by JOINs in GetByOrder / GetAll
    public string? PaymentMethodName { get; set; }
    public string? PaymentMethodCode { get; set; }
    public string? OrderNumber       { get; set; }
    public string? CustomerName      { get; set; }
}
