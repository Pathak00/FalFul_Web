CREATE OR ALTER PROCEDURE sp_Order_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: order header
    SELECT o.Id, o.UserId, o.OrderNumber, o.Status, o.SubTotal, o.DeliveryFee, o.ServiceFee,
           o.TotalAmount, o.PaymentMethod, o.PaymentStatus, o.DeliveryAddressId,
           o.DeliveryDate, o.DeliveryTimeSlot, o.Notes, o.CancelReason, o.CreatedAt, o.UpdatedAt,
           COALESCE(a.Label,       o.AddressLabel)   AS AddressLabel,
           COALESCE(a.FullAddress, o.FullAddress)    AS FullAddress,
           COALESCE(a.City,        o.City)            AS City,
           COALESCE(a.Landmark,    o.Landmark)        AS Landmark,
           COALESCE(a.PhoneNumber, o.DeliveryPhone)   AS DeliveryPhone,
           u.FullName AS CustomerName,
           (SELECT COUNT(*) FROM OrderItems oi WHERE oi.OrderId = o.Id) AS ItemCount
    FROM   Orders o
    LEFT   JOIN Addresses a ON a.Id = o.DeliveryAddressId
    INNER  JOIN Users u     ON u.Id = o.UserId
    WHERE  o.Id = @Id;

    -- Result set 2: order items
    SELECT Id, OrderId, ProductId, ProductName, ProductSlug, ImageUrl,
           UnitPrice, Quantity, Unit, TotalPrice, IsCustomBuild, CustomBuildDetails
    FROM   OrderItems
    WHERE  OrderId = @Id
    ORDER  BY Id;

    -- Result set 3: delivery (with expanded fields)
    SELECT Id, OrderId, Status, ScheduledDate, ScheduledTimeSlot,
           RiderName, RiderPhone, AssignedAt, PickedUpAt, DeliveredAt,
           FailedAt, AttemptCount, MaxAttempts, TrackingNotes, CreatedAt, UpdatedAt
    FROM   Deliveries
    WHERE  OrderId = @Id;

    -- Result set 4: delivery attempts (customer-visible history)
    SELECT da.Id, da.DeliveryId, da.AttemptNumber, da.AttemptedAt,
           da.WasSuccessful, da.FailureReason, da.FailureNotes,
           da.NextAction, da.RescheduledDate, da.RescheduledTimeSlot
    FROM   DeliveryAttempts da
    INNER  JOIN Deliveries d ON d.Id = da.DeliveryId
    WHERE  d.OrderId = @Id
    ORDER  BY da.AttemptNumber;
END
