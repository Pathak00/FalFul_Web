namespace FalFul.Application.DTOs.Order;

// ── Inbound ───────────────────────────────────────────────────────────────────

public class AssignRiderDto
{
    public int RiderUserId { get; set; }
}

public class RiderUserDto
{
    public int    Id          { get; set; }
    public string FullName    { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email       { get; set; } = string.Empty;
}

public class UpdateDeliveryStatusDto
{
    public byte    Status            { get; set; }
    public string? TrackingNotes     { get; set; }
    public string? ScheduledDate     { get; set; }  // ISO date yyyy-MM-dd; for admin reschedule
    public string? ScheduledTimeSlot { get; set; }
}

public class LogDeliveryAttemptDto
{
    public string? RiderName           { get; set; }
    public string? RiderPhone          { get; set; }
    public bool    WasSuccessful       { get; set; }
    public byte?   FailureReason       { get; set; }
    public string? FailureNotes        { get; set; }
    public byte?   NextAction          { get; set; }  // 1=Reschedule 2=ReturnToWarehouse 3=RetryToday
    public string? RescheduledDate     { get; set; }  // ISO date yyyy-MM-dd
    public string? RescheduledTimeSlot { get; set; }
}

public class ReportIssueDto
{
    public byte   IssueType   { get; set; }
    public byte   ReportedBy  { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class ResolveIssueDto
{
    public string? ResolutionNotes { get; set; }
}

// ── Outbound ──────────────────────────────────────────────────────────────────

public class DeliveryAttemptDto
{
    public int      Id                  { get; set; }
    public byte     AttemptNumber       { get; set; }
    public DateTime AttemptedAt         { get; set; }
    public string?  RiderName           { get; set; }
    public string?  RiderPhone          { get; set; }
    public bool     WasSuccessful       { get; set; }
    public byte?    FailureReason       { get; set; }
    public string?  FailureReasonLabel  { get; set; }
    public string?  FailureNotes        { get; set; }
    public byte?    NextAction          { get; set; }
    public string?  NextActionLabel     { get; set; }
    public string?  RescheduledDate     { get; set; }
    public string?  RescheduledTimeSlot { get; set; }
}

public class DeliveryIssueDto
{
    public int       Id              { get; set; }
    public byte      IssueType       { get; set; }
    public string    IssueTypeLabel  { get; set; } = string.Empty;
    public byte      ReportedBy      { get; set; }
    public string    ReportedByLabel { get; set; } = string.Empty;
    public string    Description     { get; set; } = string.Empty;
    public DateTime  ReportedAt      { get; set; }
    public DateTime? ResolvedAt      { get; set; }
    public string?   ResolutionNotes { get; set; }
    public bool      IsResolved      { get; set; }
}

public class DeliverySummaryDto
{
    public int      Id                { get; set; }
    public int      OrderId           { get; set; }
    public string   OrderNumber       { get; set; } = string.Empty;
    public byte     Status            { get; set; }
    public string   StatusLabel       { get; set; } = string.Empty;
    public string   ScheduledDate     { get; set; } = string.Empty;
    public string   ScheduledTimeSlot { get; set; } = string.Empty;
    public int?     RiderUserId       { get; set; }
    public string?  RiderName         { get; set; }
    public string?  RiderPhone        { get; set; }
    public byte     AttemptCount      { get; set; }
    public byte     MaxAttempts       { get; set; }
    public string   CustomerName      { get; set; } = string.Empty;
    public string   City              { get; set; } = string.Empty;
    public string   FullAddress       { get; set; } = string.Empty;
    public string   DeliveryPhone     { get; set; } = string.Empty;
    public decimal  TotalAmount       { get; set; }
    public DateTime CreatedAt         { get; set; }
    public DateTime? AssignedAt       { get; set; }
    public DateTime? DeliveredAt      { get; set; }
    public DateTime? FailedAt         { get; set; }
}

public class DeliveryOrderItemDto
{
    public int     Id                 { get; set; }
    public string  ProductName        { get; set; } = string.Empty;
    public decimal Quantity           { get; set; }
    public string  Unit               { get; set; } = string.Empty;
    public decimal UnitPrice          { get; set; }
    public decimal TotalPrice         { get; set; }
    public bool    IsCustomBuild      { get; set; }
    public string? CustomBuildDetails { get; set; }
}

public class DeliveryDetailDto : DeliverySummaryDto
{
    public decimal   SubTotal      { get; set; }
    public decimal   DeliveryFee   { get; set; }
    public decimal   ServiceFee    { get; set; }
    public string?   Landmark      { get; set; }
    public string?   OrderNotes    { get; set; }
    public byte      PaymentMethod { get; set; }
    public DateTime? PickedUpAt    { get; set; }
    public string?   TrackingNotes { get; set; }
    public List<DeliveryAttemptDto>   Attempts { get; set; } = [];
    public List<DeliveryIssueDto>     Issues   { get; set; } = [];
    public List<DeliveryOrderItemDto> Items    { get; set; } = [];
}
