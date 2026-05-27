namespace FalFul.Domain.Enums;

/// <summary>
/// Tracks the logistics lifecycle only.
/// Activated once the linked order reaches ReadyForDelivery.
/// </summary>
public enum DeliveryStatus : byte
{
    AwaitingRider       = 1,   // No rider assigned yet
    RiderAssigned       = 2,   // Rider assigned, not yet picked up
    PickedUp            = 3,   // Rider has collected the order
    OutForDelivery      = 4,   // En route to customer
    Delivered           = 5,   // Successfully delivered
    DeliveryFailed      = 6,   // Attempt failed — retry expected same day
    CustomerUnavailable = 7,   // Customer not reachable/present — awaiting reschedule decision
    Rescheduled         = 8,   // Delivery rescheduled; awaiting new rider assignment
    Returned            = 9    // Returned to warehouse after max attempts or explicit return
}
