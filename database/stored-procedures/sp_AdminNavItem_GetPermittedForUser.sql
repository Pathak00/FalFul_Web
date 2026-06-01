SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Returns every AdminNavItem the user has permission to access,
-- regardless of IsVisible. Used by the client-side route guard so that
-- hidden items still enforce their RequiredPermission.
-- (Compare with sp_AdminNavItem_GetForUser which also requires IsVisible = 1.)
CREATE OR ALTER PROCEDURE sp_AdminNavItem_GetPermittedForUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleId     INT;
    DECLARE @PortalType NVARCHAR(20);

    SELECT TOP 1 @RoleId = ur.RoleId, @PortalType = r.PortalType
    FROM   UserRoles ur
    JOIN   Roles r ON r.Id = ur.RoleId
    WHERE  ur.UserId = @UserId;

    -- Returns all items the user has permission for (regardless of IsVisible).
    -- Used by the route guard — same portal-scope filtering as GetForUser.
    SELECT Id, Label, Route, Icon, ParentId, GroupLabel, DisplayOrder, IsVisible,
           RequiredPermission, IsSystem, PortalScope
    FROM   AdminNavItems
    WHERE  (
               RequiredPermission IS NULL
           OR  EXISTS (
                   SELECT 1
                   FROM   Permissions p
                   JOIN   RolePermissions rp ON rp.PermissionId = p.Id
                   WHERE  p.Name    = RequiredPermission
                     AND  rp.RoleId = @RoleId
               )
           )
      AND  (
               PortalScope IS NULL
           OR  PortalScope = @PortalType
           )
    ORDER BY DisplayOrder;
END
GO
