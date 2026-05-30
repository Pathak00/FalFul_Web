CREATE OR ALTER PROCEDURE sp_Delivery_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: delivery with order / address / user context
    SELECT d.Id, d.OrderId, d.Status, d.ScheduledDate, d.ScheduledTimeSlot,
           d.RiderUserId, d.RiderName, d.RiderPhone, d.AssignedAt, d.PickedUpAt, d.DeliveredAt,
           d.FailedAt, d.AttemptCount, d.MaxAttempts, d.TrackingNotes,
           d.CreatedAt, d.UpdatedAt,
           o.OrderNumber, o.SubTotal, o.DeliveryFee, o.ServiceFee, o.TotalAmount, o.PaymentMethod, o.Notes AS OrderNotes,
           COALESCE(a.FullAddress, o.FullAddress)   AS FullAddress,
           COALESCE(a.City,        o.City)           AS City,
           COALESCE(a.Landmark,    o.Landmark)       AS Landmark,
           COALESCE(a.PhoneNumber, o.DeliveryPhone)  AS DeliveryPhone,
           u.FullName AS CustomerName,
           u.Id       AS UserId
    FROM   Deliveries d
    INNER  JOIN Orders    o ON o.Id = d.OrderId
    LEFT   JOIN Addresses a ON a.Id = o.DeliveryAddressId
    INNER  JOIN Users     u ON u.Id = o.UserId
    WHERE  d.Id = @Id;

    -- Result set 2: delivery attempts
    SELECT Id, DeliveryId, AttemptNumber, AttemptedAt, RiderName, RiderPhone,
           WasSuccessful, FailureReason, FailureNotes, NextAction,
           RescheduledDate, RescheduledTimeSlot, CreatedAt
    FROM   DeliveryAttempts
    WHERE  DeliveryId = @Id
    ORDER  BY AttemptNumber;

    -- Result set 3: delivery issues
    SELECT Id, DeliveryId, IssueType, ReportedBy, Description,
           ReportedAt, ResolvedAt, ResolutionNotes, IsResolved
    FROM   DeliveryIssues
    WHERE  DeliveryId = @Id
    ORDER  BY ReportedAt;

    -- Result set 4: order items
    SELECT oi.Id, oi.OrderId, oi.ProductId, oi.ProductName, oi.ProductSlug,
           oi.ImageUrl, oi.UnitPrice, oi.Quantity, oi.Unit, oi.TotalPrice,
           oi.IsCustomBuild, oi.CustomBuildDetails
    FROM   OrderItems oi
    INNER  JOIN Deliveries d ON d.OrderId = oi.OrderId
    WHERE  d.Id = @Id
    ORDER  BY oi.Id;
END
