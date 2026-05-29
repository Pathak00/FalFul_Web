SET QUOTED_IDENTIFIER ON
GO
-- Assigns a rider to a delivery by RiderUserId.
-- Looks up the rider's name and phone from the Users table to keep delivery records
-- in sync with the registered user, and rejects inactive or non-existent users.
CREATE OR ALTER PROCEDURE sp_Delivery_Assign
    @Id          INT,
    @RiderUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DECLARE @RiderName  NVARCHAR(100);
    DECLARE @RiderPhone NVARCHAR(20);

    SELECT @RiderName  = u.FullName,
           @RiderPhone = u.PhoneNumber
    FROM   Users u
    WHERE  u.Id        = @RiderUserId
      AND  u.IsDeleted = 0
      AND  u.IsActive  = 1;

    IF @RiderName IS NULL
        THROW 50001, 'Rider not found or is inactive.', 1;

    UPDATE Deliveries
    SET    RiderUserId = @RiderUserId,
           RiderName   = @RiderName,
           RiderPhone  = @RiderPhone,
           Status      = CASE WHEN Status IN (1, 6, 7, 8) THEN 2 ELSE Status END,
           AssignedAt  = CASE WHEN AssignedAt IS NULL THEN GETUTCDATE() ELSE AssignedAt END,
           UpdatedAt   = GETUTCDATE()
    WHERE  Id = @Id;
END
