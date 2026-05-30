SET QUOTED_IDENTIFIER ON
GO
-- Returns permission names for a user, sourced exclusively from their role's RolePermissions.
-- Pure RBAC: UserPermissions table has been removed (migration 020).
CREATE OR ALTER PROCEDURE sp_UserPermission_GetEffective
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleId INT;
    SELECT TOP 1 @RoleId = RoleId FROM UserRoles WHERE UserId = @UserId;

    SELECT p.Name
    FROM   Permissions p
    JOIN   RolePermissions rp ON rp.PermissionId = p.Id
    WHERE  rp.RoleId = @RoleId
    ORDER  BY p.Name;
END
