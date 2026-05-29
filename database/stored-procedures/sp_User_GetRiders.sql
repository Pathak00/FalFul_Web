SET QUOTED_IDENTIFIER ON
GO
-- Returns all active users who have the 'deliveries' permission (i.e. Riders).
-- Used by admin to populate the rider assignment dropdown.
CREATE OR ALTER PROCEDURE sp_User_GetRiders
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT u.Id, u.FullName, u.PhoneNumber, u.Email
    FROM   Users u
    JOIN   UserRoles       ur ON ur.UserId       = u.Id
    JOIN   RolePermissions rp ON rp.RoleId       = ur.RoleId
    JOIN   Permissions     p  ON p.Id            = rp.PermissionId
    WHERE  p.Name      = 'deliveries'
      AND  u.IsDeleted = 0
      AND  u.IsActive  = 1
    ORDER BY u.FullName;
END
