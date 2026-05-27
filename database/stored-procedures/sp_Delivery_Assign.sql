SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Delivery_Assign
    @Id         INT,
    @RiderName  NVARCHAR(100),
    @RiderPhone NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE Deliveries
    SET    RiderName  = @RiderName,
           RiderPhone = @RiderPhone,
           Status     = CASE WHEN Status = 1 THEN 2 ELSE Status END,
           AssignedAt = CASE WHEN AssignedAt IS NULL THEN GETUTCDATE() ELSE AssignedAt END,
           UpdatedAt  = GETUTCDATE()
    WHERE  Id = @Id;
END
