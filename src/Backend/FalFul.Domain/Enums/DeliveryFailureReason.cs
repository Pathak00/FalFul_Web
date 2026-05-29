namespace FalFul.Domain.Enums;

public enum DeliveryFailureReason : byte
{
    CustomerNotHome     = 1,
    WrongAddress        = 2,
    CustomerRefused     = 3,
    PaymentRefused      = 4,
    ProductDamaged      = 5,
    WeatherConditions   = 6,
    VehicleBreakdown    = 7,
    ContactNotReachable = 8,
    AddressNotFound     = 9,
    Other               = 10
}
