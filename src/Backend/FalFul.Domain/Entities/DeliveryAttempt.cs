namespace FalFul.Domain.Entities;

public class DeliveryAttempt
{
    public int       Id                  { get; set; }
    public int       DeliveryId          { get; set; }
    public byte      AttemptNumber       { get; set; }
    public DateTime  AttemptedAt         { get; set; }
    public string?   RiderName           { get; set; }
    public string?   RiderPhone          { get; set; }
    public bool      WasSuccessful       { get; set; }
    public byte?     FailureReason       { get; set; }
    public string?   FailureNotes        { get; set; }
    public byte?     NextAction          { get; set; }  // 1=Reschedule 2=ReturnToWarehouse 3=RetryToday
    public DateTime? RescheduledDate     { get; set; }  // DATE stored as DateTime midnight
    public string?   RescheduledTimeSlot { get; set; }
    public DateTime  CreatedAt           { get; set; }
}
