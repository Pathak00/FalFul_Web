SET QUOTED_IDENTIFIER ON
GO
-- Assigns a rider to a delivery.
-- Auto-links RiderUserId by matching the phone to any user whose role has the
-- `deliveries` permission — no hardcoded UserType checks.
CREATE OR ALTER PROCEDURE sp_Delivery_Assign
    @Id         INT,
    @RiderName  NVARCHAR(100),
    @RiderPhone NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE Deliveries
    SET    RiderName   = @RiderName,
           RiderPhone  = @RiderPhone,
           RiderUserId = (
               SELECT TOP 1 u.Id
               FROM   Users u
               JOIN   UserRoles       ur  ON ur.UserId       = u.Id
               JOIN   RolePermissions rp  ON rp.RoleId       = ur.RoleId
               JOIN   Permissions     p   ON p.Id            = rp.PermissionId
               WHERE  u.PhoneNumber = @RiderPhone
                 AND  p.Name        = 'deliveries'
                 AND  u.IsDeleted   = 0
                 AND  u.IsActive    = 1
           ),
           Status     = CASE WHEN Status IN (1, 6, 7, 8) THEN 2 ELSE Status END,
           AssignedAt = CASE WHEN AssignedAt IS NULL THEN GETUTCDATE() ELSE AssignedAt END,
           UpdatedAt  = GETUTCDATE()
    WHERE  Id = @Id;
END
