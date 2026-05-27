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

    -- NextAction values:
    --   1 = Reschedule         → DeliveryStatus 8 (Rescheduled)
    --   2 = Return to Warehouse → DeliveryStatus 9 (Returned)
    --   3 = Retry Same Day     → DeliveryStatus 6 (DeliveryFailed)
    --   4 = Customer Unavailable → DeliveryStatus 7 (CustomerUnavailable)

    DECLARE @AttemptNumber TINYINT;
    SELECT @AttemptNumber = ISNULL(MAX(AttemptNumber), 0) + 1
    FROM   DeliveryAttempts WHERE DeliveryId = @DeliveryId;

    INSERT INTO DeliveryAttempts (DeliveryId, AttemptNumber, AttemptedAt, RiderName, RiderPhone,
                                  WasSuccessful, FailureReason, FailureNotes, NextAction,
                                  RescheduledDate, RescheduledTimeSlot)
    VALUES (@DeliveryId, @AttemptNumber, GETUTCDATE(), @RiderName, @RiderPhone,
            @WasSuccessful, @FailureReason, @FailureNotes, @NextAction,
            @RescheduledDate, @RescheduledTimeSlot);

    DECLARE @MaxAttempts TINYINT;
    SELECT @MaxAttempts = MaxAttempts FROM Deliveries WHERE Id = @DeliveryId;

    IF @WasSuccessful = 1
    BEGIN
        UPDATE Deliveries
        SET    Status       = 5,          -- Delivered
               AttemptCount = @AttemptNumber,
               DeliveredAt  = GETUTCDATE(),
               UpdatedAt    = GETUTCDATE()
        WHERE  Id = @DeliveryId;
    END
    ELSE IF @AttemptNumber >= @MaxAttempts OR @NextAction = 2  -- Return to Warehouse
    BEGIN
        UPDATE Deliveries
        SET    Status       = 9,          -- Returned
               AttemptCount = @AttemptNumber,
               FailedAt     = GETUTCDATE(),
               UpdatedAt    = GETUTCDATE()
        WHERE  Id = @DeliveryId;
    END
    ELSE IF @NextAction = 1               -- Reschedule
    BEGIN
        UPDATE Deliveries
        SET    Status             = 8,    -- Rescheduled (awaiting new rider assignment)
               AttemptCount      = @AttemptNumber,
               ScheduledDate     = ISNULL(@RescheduledDate, ScheduledDate),
               ScheduledTimeSlot = ISNULL(@RescheduledTimeSlot, ScheduledTimeSlot),
               FailedAt          = GETUTCDATE(),
               UpdatedAt         = GETUTCDATE()
        WHERE  Id = @DeliveryId;
    END
    ELSE IF @NextAction = 4               -- Customer Unavailable
    BEGIN
        UPDATE Deliveries
        SET    Status       = 7,          -- CustomerUnavailable
               AttemptCount = @AttemptNumber,
               FailedAt     = GETUTCDATE(),
               UpdatedAt    = GETUTCDATE()
        WHERE  Id = @DeliveryId;
    END
    ELSE                                  -- Retry same day
    BEGIN
        UPDATE Deliveries
        SET    Status       = 6,          -- DeliveryFailed (will attempt again)
               AttemptCount = @AttemptNumber,
               FailedAt     = GETUTCDATE(),
               UpdatedAt    = GETUTCDATE()
        WHERE  Id = @DeliveryId;
    END
END
