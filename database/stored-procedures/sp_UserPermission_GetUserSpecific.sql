SET QUOTED_IDENTIFIER ON
GO
-- Returns only the explicitly-granted user-level permissions (for admin viewing staff config).
CREATE OR ALTER PROCEDURE sp_UserPermission_GetUserSpecific
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Name
    FROM   UserPermissions up
    JOIN   Permissions p ON p.Id = up.PermissionId
    WHERE  up.UserId = @UserId AND up.Granted = 1
    ORDER BY p.SortOrder;
END
