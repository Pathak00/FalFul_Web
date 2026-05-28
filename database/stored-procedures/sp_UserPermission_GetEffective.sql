SET QUOTED_IDENTIFIER ON
GO
-- Returns effective permission names for a user.
-- Source: RolePermissions (role defaults) UNION UserPermissions (individual overrides).
-- No role-name bypass — all permissions flow through RolePermissions in the database.
CREATE OR ALTER PROCEDURE sp_UserPermission_GetEffective
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleId INT;

    SELECT TOP 1 @RoleId = RoleId
    FROM   UserRoles
    WHERE  UserId = @UserId;

    SELECT DISTINCT p.Name
    FROM   Permissions p
    WHERE  p.Id IN (
        SELECT PermissionId FROM RolePermissions  WHERE RoleId  = @RoleId
        UNION
        SELECT PermissionId FROM UserPermissions  WHERE UserId  = @UserId AND Granted = 1
    )
    ORDER BY p.Name;
END
