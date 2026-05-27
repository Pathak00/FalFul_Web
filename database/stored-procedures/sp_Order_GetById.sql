CREATE OR ALTER PROCEDURE sp_Order_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT o.Id, o.UserId, o.OrderNumber, o.Status, o.SubTotal, o.DeliveryFee, o.ServiceFee,
           o.TotalAmount, o.PaymentMethod, o.PaymentStatus, o.DeliveryAddressId,
           o.DeliveryDate, o.DeliveryTimeSlot, o.Notes, o.CancelReason, o.CreatedAt, o.UpdatedAt,
           a.Label AS AddressLabel, a.FullAddress, a.City, a.Landmark, a.PhoneNumber AS DeliveryPhone,
           u.FullName AS CustomerName
    FROM   Orders o
    INNER  JOIN Addresses a ON a.Id = o.DeliveryAddressId
    INNER  JOIN Users u     ON u.Id = o.UserId
    WHERE  o.Id = @Id;

    SELECT Id, OrderId, ProductId, ProductName, ProductSlug, ImageUrl,
           UnitPrice, Quantity, Unit, TotalPrice, IsCustomBuild, CustomBuildDetails
    FROM   OrderItems
    WHERE  OrderId = @Id
    ORDER  BY Id;

    SELECT Id, OrderId, Status, ScheduledDate, ScheduledTimeSlot,
           DeliveredAt, RiderName, RiderPhone, TrackingNotes
    FROM   Deliveries
    WHERE  OrderId = @Id;
END
