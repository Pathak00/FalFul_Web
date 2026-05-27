CREATE OR ALTER PROCEDURE sp_Delivery_GetAll
    @Status   TINYINT = NULL,
    @FromDate DATE    = NULL,
    @ToDate   DATE    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT d.Id, d.OrderId, d.Status, d.ScheduledDate, d.ScheduledTimeSlot,
           d.RiderName, d.RiderPhone, d.AssignedAt, d.PickedUpAt, d.DeliveredAt,
           d.FailedAt, d.AttemptCount, d.MaxAttempts, d.TrackingNotes,
           d.CreatedAt, d.UpdatedAt,
           o.OrderNumber, o.TotalAmount, o.PaymentMethod,
           COALESCE(a.FullAddress, o.FullAddress)   AS FullAddress,
           COALESCE(a.City,        o.City)           AS City,
           COALESCE(a.PhoneNumber, o.DeliveryPhone)  AS DeliveryPhone,
           u.FullName AS CustomerName,
           u.Id       AS UserId
    FROM   Deliveries d
    INNER  JOIN Orders    o ON o.Id = d.OrderId
    LEFT   JOIN Addresses a ON a.Id = o.DeliveryAddressId
    INNER  JOIN Users     u ON u.Id = o.UserId
    WHERE  (@Status   IS NULL OR d.Status        = @Status)
      AND  (@FromDate IS NULL OR d.ScheduledDate >= @FromDate)
      AND  (@ToDate   IS NULL OR d.ScheduledDate <= @ToDate)
    ORDER  BY d.ScheduledDate DESC, d.Id DESC;
END
