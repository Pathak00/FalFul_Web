namespace FalFul.Domain.Enums;

/// <summary>
/// Tracks the order business lifecycle only.
/// Orders reach ReadyForDelivery(4) and then transfer to the Deliveries module.
/// Delivery completion is tracked in DeliveryStatus — not here.
/// </summary>
public enum OrderStatus
{
    AwaitingPayment  = 7,   // Order placed but advance/online payment not yet verified
    Pending          = 1,   // Order placed and payment verified (or COD no advance), awaiting admin review
    Confirmed        = 2,   // Admin confirmed
    Preparing        = 3,   // Kitchen/warehouse is preparing the order
    ReadyForDelivery = 4,   // Preparation complete — delivery record is created at this point
    Cancelled        = 5,   // Cancelled by customer or admin (before/during preparation)
    Rejected         = 6    // Rejected by admin (e.g. out of stock, unserviceable area)
}
