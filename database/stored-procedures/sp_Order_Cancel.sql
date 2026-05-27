SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Order_Cancel
    @Id           INT,
    @UserId       INT,
    @CancelReason NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    -- Only allow cancel if status is Pending(1) or Confirmed(2)
    IF NOT EXISTS (SELECT 1 FROM Orders WHERE Id = @Id AND UserId = @UserId AND Status IN (1, 2))
    BEGIN
        RAISERROR('Order cannot be cancelled at this stage.', 16, 1);
        RETURN;
    END

    UPDATE Orders
    SET    Status = 6, CancelReason = @CancelReason, UpdatedAt = GETUTCDATE()
    WHERE  Id = @Id AND UserId = @UserId;

    UPDATE Deliveries SET Status = 5, UpdatedAt = GETUTCDATE() WHERE OrderId = @Id;
END
