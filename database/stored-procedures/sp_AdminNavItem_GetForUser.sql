SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Returns the admin sidebar items a specific user is allowed to see,
-- based exclusively on their role's permissions (pure RBAC, no user-level overrides).
CREATE OR ALTER PROCEDURE sp_AdminNavItem_GetForUser
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

    SELECT Id, Label, Route, Icon, ParentId, GroupLabel, DisplayOrder, IsVisible,
           RequiredPermission, IsSystem, PortalScope
    FROM   AdminNavItems
    WHERE  IsVisible = 1
      -- Permission check: NULL = no permission required, otherwise user must have it
      AND (
              RequiredPermission IS NULL
          OR  EXISTS (
                  SELECT 1
                  FROM   Permissions p
                  JOIN   RolePermissions rp ON rp.PermissionId = p.Id
                  WHERE  p.Name    = RequiredPermission
                    AND  rp.RoleId = @RoleId
              )
      )
      -- Portal scope check: NULL = all portals, otherwise must match the user's portal type
      AND (
              PortalScope IS NULL
          OR  PortalScope = @PortalType
      )
    ORDER BY DisplayOrder;
END
GO
