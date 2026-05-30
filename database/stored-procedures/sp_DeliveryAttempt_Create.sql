SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_DeliveryAttempt_Create
    @DeliveryId          INT,
    @RiderName           NVARCHAR(100) = NULL,
    @RiderPhone          NVARCHAR(20)  = NULL,
    @WasSuccessful       BIT,
    @FailureReason       TINYINT       = NULL,
    @FailureNotes        NVARCHAR(500) = NULL,
    @NextAction          TINYINT       = NULL,
    @RescheduledDate     DATE          = NULL,
    @RescheduledTimeSlot NVARCHAR(30)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    -- NextAction values (explicit admin decision â€” takes precedence over auto-return):
    --   1 = Reschedule           â†’ DeliveryStatus 8 (Rescheduled)
    --   2 = Return to Warehouse  â†’ DeliveryStatus 9 (Returned)
    --   3 = Retry Today          â†’ DeliveryStatus 6 (DeliveryFailed)
    --   4 = Customer Unavailable â†’ DeliveryStatus 7 (CustomerUnavailable)

    DECLARE @AttemptNumber TINYINT;
    SELECT @AttemptNumber = ISNULL(MAX(AttemptNumber), 0) + 1
    FROM   DeliveryAttempts WHERE DeliveryId = @DeliveryId;

    INSERT INTO DeliveryAttempts (DeliveryId, AttemptNumber, AttemptedAt, RiderName, RiderPhone,
                                  WasSuccessful, FailureReason, FailureNotes, NextAction,
                                  RescheduledDate, RescheduledTimeSlot)
    VALUES (@DeliveryId, @AttemptNumber, dbo.fn_NepalNow(), @RiderName, @RiderPhone,
            @WasSuccessful, @FailureReason, @FailureNotes, @NextAction,
            @RescheduledDate, @RescheduledTimeSlot);

    DECLARE @MaxAttempts TINYINT;
    SELECT @MaxAttempts = MaxAttempts FROM Deliveries WHERE Id = @DeliveryId;

    IF @WasSuccessful = 1
    BEGIN
        -- Success path: items delivered — decrement stock
        UPDATE Deliveries
        SET    Status       = 5,          -- Delivered
               AttemptCount = @AttemptNumber,
               DeliveredAt  = dbo.fn_NepalNow(),
               UpdatedAt    = dbo.fn_NepalNow()
        WHERE  Id = @DeliveryId;

        UPDATE p
        SET    p.Stock = p.Stock - oi.Quantity
        FROM   Products   p
        JOIN   OrderItems oi ON oi.ProductId = p.Id
        JOIN   Deliveries d  ON d.OrderId    = oi.OrderId
        WHERE  d.Id = @DeliveryId
          AND  oi.ProductId IS NOT NULL;
    END
    ELSE IF @NextAction = 2               -- Explicit: Return to Warehouse — restore stock
    BEGIN
        UPDATE Deliveries
        SET    Status       = 9,          -- Returned
               AttemptCount = @AttemptNumber,
               FailedAt     = dbo.fn_NepalNow(),
               UpdatedAt    = dbo.fn_NepalNow()
        WHERE  Id = @DeliveryId;

        UPDATE p
        SET    p.Stock = p.Stock + oi.Quantity
        FROM   Products   p
        JOIN   OrderItems oi ON oi.ProductId = p.Id
        JOIN   Deliveries d  ON d.OrderId    = oi.OrderId
        WHERE  d.Id = @DeliveryId
          AND  oi.ProductId IS NOT NULL;
    END
    ELSE IF @NextAction = 1               -- Explicit: Reschedule (overrides max-attempt auto-return)
    BEGIN
        UPDATE Deliveries
        SET    Status             = 8,    -- Rescheduled
               AttemptCount      = @AttemptNumber,
               ScheduledDate     = ISNULL(@RescheduledDate, ScheduledDate),
               ScheduledTimeSlot = ISNULL(@RescheduledTimeSlot, ScheduledTimeSlot),
               FailedAt          = dbo.fn_NepalNow(),
               UpdatedAt         = dbo.fn_NepalNow()
        WHERE  Id = @DeliveryId;
    END
    ELSE IF @NextAction = 4               -- Explicit: Customer Unavailable
    BEGIN
        UPDATE Deliveries
        SET    Status       = 7,          -- CustomerUnavailable
               AttemptCount = @AttemptNumber,
               FailedAt     = dbo.fn_NepalNow(),
               UpdatedAt    = dbo.fn_NepalNow()
        WHERE  Id = @DeliveryId;
    END
    ELSE IF @AttemptNumber >= @MaxAttempts -- Auto-return: max attempts reached — restore stock
    BEGIN
        UPDATE Deliveries
        SET    Status       = 9,          -- Returned
               AttemptCount = @AttemptNumber,
               FailedAt     = dbo.fn_NepalNow(),
               UpdatedAt    = dbo.fn_NepalNow()
        WHERE  Id = @DeliveryId;

        UPDATE p
        SET    p.Stock = p.Stock + oi.Quantity
        FROM   Products   p
        JOIN   OrderItems oi ON oi.ProductId = p.Id
        JOIN   Deliveries d  ON d.OrderId    = oi.OrderId
        WHERE  d.Id = @DeliveryId
          AND  oi.ProductId IS NOT NULL;
    END
    ELSE                                  -- Default: Retry (NextAction=3 or no action given)
    BEGIN
        UPDATE Deliveries
        SET    Status       = 6,          -- DeliveryFailed (retry pending)
               AttemptCount = @AttemptNumber,
               FailedAt     = dbo.fn_NepalNow(),
               UpdatedAt    = dbo.fn_NepalNow()
        WHERE  Id = @DeliveryId;
    END
END

