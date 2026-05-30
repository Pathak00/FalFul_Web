SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Delivery_UpdateStatus
    @Id                INT,
    @Status            TINYINT,
    @TrackingNotes     NVARCHAR(500) = NULL,
    @ScheduledDate     DATE          = NULL,
    @ScheduledTimeSlot NVARCHAR(30)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DECLARE @OldStatus TINYINT;
    SELECT @OldStatus = Status FROM Deliveries WHERE Id = @Id;

    UPDATE Deliveries
    SET    Status             = @Status,
           ScheduledDate      = ISNULL(@ScheduledDate,     ScheduledDate),
           ScheduledTimeSlot  = ISNULL(@ScheduledTimeSlot, ScheduledTimeSlot),
           PickedUpAt         = CASE WHEN @Status = 3 AND PickedUpAt IS NULL THEN dbo.fn_NepalNow() ELSE PickedUpAt  END,
           DeliveredAt        = CASE WHEN @Status = 5                         THEN dbo.fn_NepalNow() ELSE DeliveredAt END,
           FailedAt           = CASE WHEN @Status IN (6, 7, 9) AND FailedAt IS NULL THEN dbo.fn_NepalNow() ELSE FailedAt END,
           TrackingNotes      = ISNULL(@TrackingNotes, TrackingNotes),
           UpdatedAt          = dbo.fn_NepalNow()
    WHERE  Id = @Id;

    -- ── Stock adjustments ──────────────────────────────────────────────────────
    -- Delivered(5): items left the warehouse — decrement product stock.
    -- Returned(9):  items are physically back — restore product stock.
    -- Guard against double-adjustment: only act when status actually transitions.

    IF @Status = 5 AND @OldStatus <> 5
    BEGIN
        UPDATE p
        SET    p.Stock = p.Stock - oi.Quantity
        FROM   Products   p
        JOIN   OrderItems oi ON oi.ProductId = p.Id
        JOIN   Deliveries d  ON d.OrderId    = oi.OrderId
        WHERE  d.Id = @Id
          AND  oi.ProductId IS NOT NULL;
    END
    ELSE IF @Status = 9 AND @OldStatus <> 9
    BEGIN
        UPDATE p
        SET    p.Stock = p.Stock + oi.Quantity
        FROM   Products   p
        JOIN   OrderItems oi ON oi.ProductId = p.Id
        JOIN   Deliveries d  ON d.OrderId    = oi.OrderId
        WHERE  d.Id = @Id
          AND  oi.ProductId IS NOT NULL;
    END
END
