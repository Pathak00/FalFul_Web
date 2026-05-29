SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Order_UpdateStatus
    @Id     INT,
    @Status TINYINT,
    @Reason NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE Orders
    SET    Status       = @Status,
           -- Store reason for both Cancelled(5) and Rejected(6)
           CancelReason = CASE WHEN @Status IN (5, 6) THEN @Reason ELSE CancelReason END,
           UpdatedAt    = GETUTCDATE()
    WHERE  Id = @Id;

    -- Cancelled(5) or Rejected(6): cascade to any active delivery
    -- Orders module does NOT manage logistics; this only marks the delivery as failed
    -- so it is removed from the active delivery queue.
    IF @Status IN (5, 6)
        UPDATE Deliveries
        SET    Status    = 6,           -- DeliveryFailed
               FailedAt  = ISNULL(FailedAt, GETUTCDATE()),
               UpdatedAt = GETUTCDATE()
        WHERE  OrderId = @Id AND Status NOT IN (5, 9);  -- skip Delivered(5), Returned(9)
END
