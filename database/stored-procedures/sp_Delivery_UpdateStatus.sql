SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Delivery_UpdateStatus
    @Id               INT,
    @Status           TINYINT,
    @TrackingNotes    NVARCHAR(500) = NULL,
    @ScheduledDate    DATE          = NULL,
    @ScheduledTimeSlot NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE Deliveries
    SET    Status             = @Status,
           -- Allow admin to update schedule when transitioning to Rescheduled(8)
           ScheduledDate      = ISNULL(@ScheduledDate,     ScheduledDate),
           ScheduledTimeSlot  = ISNULL(@ScheduledTimeSlot, ScheduledTimeSlot),
           PickedUpAt         = CASE WHEN @Status = 3 AND PickedUpAt IS NULL THEN GETUTCDATE() ELSE PickedUpAt  END,
           DeliveredAt        = CASE WHEN @Status = 5                         THEN GETUTCDATE() ELSE DeliveredAt END,
           -- DeliveryFailed(6), CustomerUnavailable(7), Returned(9): stamp FailedAt on first occurrence
           FailedAt           = CASE WHEN @Status IN (6, 7, 9) AND FailedAt IS NULL THEN GETUTCDATE() ELSE FailedAt END,
           TrackingNotes      = ISNULL(@TrackingNotes, TrackingNotes),
           UpdatedAt          = GETUTCDATE()
    WHERE  Id = @Id;

    -- Delivery module does NOT push status changes back to Orders.
    -- Orders module owns the order lifecycle; delivery completion is tracked here only.
END
