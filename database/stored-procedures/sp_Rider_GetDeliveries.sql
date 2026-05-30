SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Rider_GetDeliveries
    @RiderUserId INT,
    @Status      TINYINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        d.Id, d.OrderId, d.Status, d.ScheduledDate, d.ScheduledTimeSlot,
        d.RiderName, d.RiderPhone, d.AttemptCount, d.MaxAttempts,
        d.TrackingNotes, d.CreatedAt, d.AssignedAt, d.DeliveredAt, d.FailedAt, d.PickedUpAt,
        d.CollectedAmount, d.ProofPhotoUrl, d.CollectionRemarks,
        o.OrderNumber, o.TotalAmount, o.AdvanceAmount,
        o.TotalAmount - o.AdvanceAmount AS RemainingBalance,
        o.PaymentMethod,
        COALESCE(a.FullAddress, o.FullAddress)  AS FullAddress,
        COALESCE(a.City,        o.City)          AS City,
        COALESCE(a.PhoneNumber, o.DeliveryPhone) AS DeliveryPhone,
        u.FullName AS CustomerName
    FROM   Deliveries d
    INNER  JOIN Orders    o ON o.Id = d.OrderId
    LEFT   JOIN Addresses a ON a.Id = o.DeliveryAddressId
    INNER  JOIN Users     u ON u.Id = o.UserId
    WHERE  d.RiderUserId = @RiderUserId
      AND  (@Status IS NULL OR d.Status = @Status)
      AND  d.Status NOT IN (9)
    ORDER  BY d.ScheduledDate DESC, d.Id DESC;
END
