SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Order_UpdateStatus
    @Id           INT,
    @Status       TINYINT,
    @CancelReason NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE Orders
    SET    Status       = @Status,
           CancelReason = CASE WHEN @Status = 6 THEN @CancelReason ELSE CancelReason END,
           UpdatedAt    = GETUTCDATE()
    WHERE  Id = @Id;

    -- Sync delivery status when order status changes
    IF @Status = 4  -- OutForDelivery
        UPDATE Deliveries SET Status = 3, UpdatedAt = GETUTCDATE() WHERE OrderId = @Id;
    ELSE IF @Status = 5  -- Delivered
        UPDATE Deliveries SET Status = 4, DeliveredAt = GETUTCDATE(), UpdatedAt = GETUTCDATE() WHERE OrderId = @Id;
    ELSE IF @Status = 6  -- Cancelled
        UPDATE Deliveries SET Status = 5, UpdatedAt = GETUTCDATE() WHERE OrderId = @Id;
END
