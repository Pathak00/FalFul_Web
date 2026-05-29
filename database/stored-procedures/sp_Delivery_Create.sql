SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Delivery_Create
    @OrderId           INT,
    @ScheduledDate     DATE,
    @ScheduledTimeSlot NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    INSERT INTO Deliveries (OrderId, Status, ScheduledDate, ScheduledTimeSlot)
    VALUES (@OrderId, 1, @ScheduledDate, @ScheduledTimeSlot);
END
