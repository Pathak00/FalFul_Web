using FalFul.Domain.Enums;

namespace FalFul.Domain.Entities;

public class Delivery
{
    public int            Id                { get; set; }
    public int            OrderId           { get; set; }
    public DeliveryStatus Status            { get; set; }
    public DateOnly       ScheduledDate     { get; set; }
    public string         ScheduledTimeSlot { get; set; } = string.Empty;
    public int?           RiderUserId       { get; set; }
    public string?        RiderName         { get; set; }
    public string?        RiderPhone        { get; set; }
    public DateTime?      AssignedAt        { get; set; }
    public DateTime?      PickedUpAt        { get; set; }
    public DateTime?      DeliveredAt       { get; set; }
    public DateTime?      FailedAt          { get; set; }
    public byte           AttemptCount      { get; set; }
    public byte           MaxAttempts       { get; set; } = 3;
    public string?        TrackingNotes     { get; set; }
    public decimal?       CollectedAmount   { get; set; }
    public string?        ProofPhotoUrl     { get; set; }
    public string?        CollectionRemarks { get; set; }
    public DateTime       CreatedAt         { get; set; }
    public DateTime?      UpdatedAt         { get; set; }

    // Populated by GetAll / GetById JOINs
    public string  OrderNumber     { get; set; } = string.Empty;
    public decimal SubTotal        { get; set; }
    public decimal DeliveryFee     { get; set; }
    public decimal ServiceFee      { get; set; }
    public decimal TotalAmount     { get; set; }
    public decimal AdvanceAmount   { get; set; }
    public decimal RemainingBalance { get; set; }
    public byte    PaymentMethod   { get; set; }
    public string  CustomerName  { get; set; } = string.Empty;
    public int     UserId        { get; set; }
    public string  FullAddress   { get; set; } = string.Empty;
    public string  City          { get; set; } = string.Empty;
    public string  DeliveryPhone { get; set; } = string.Empty;
    public string? Landmark      { get; set; }
    public string? OrderNotes    { get; set; }

    public List<DeliveryAttempt> Attempts { get; set; } = [];
    public List<DeliveryIssue>   Issues   { get; set; } = [];
    public List<OrderItem>       Items    { get; set; } = [];
}
