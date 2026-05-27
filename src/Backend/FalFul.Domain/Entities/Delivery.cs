namespace FalFul.Domain.Entities;

public class Delivery
{
    public int      Id                { get; set; }
    public int      OrderId           { get; set; }
    public byte     Status            { get; set; }  // 1=Scheduled 2=PickedUp 3=OutForDelivery 4=Delivered 5=Failed
    public DateOnly ScheduledDate     { get; set; }
    public string   ScheduledTimeSlot { get; set; } = string.Empty;
    public DateTime? DeliveredAt      { get; set; }
    public string?  RiderName         { get; set; }
    public string?  RiderPhone        { get; set; }
    public string?  TrackingNotes     { get; set; }
    public DateTime CreatedAt         { get; set; }
    public DateTime? UpdatedAt        { get; set; }
}
