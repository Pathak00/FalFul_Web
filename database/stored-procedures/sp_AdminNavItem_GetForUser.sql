SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Returns the admin sidebar items a specific user is allowed to see,
-- based exclusively on their role's permissions (pure RBAC, no user-level overrides).
CREATE OR ALTER PROCEDURE sp_AdminNavItem_GetForUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleId INT;
    SELECT TOP 1 @RoleId = RoleId FROM UserRoles WHERE UserId = @UserId;

    SELECT Id, Label, Route, Icon, ParentId, GroupLabel, DisplayOrder, IsVisible, RequiredPermission, IsSystem
    FROM   AdminNavItems
    WHERE  IsVisible = 1
      AND (
              RequiredPermission IS NULL
          OR  EXISTS (
                  SELECT 1
                  FROM   Permissions p
                  JOIN   RolePermissions rp ON rp.PermissionId = p.Id
                  WHERE  p.Name      = RequiredPermission
                    AND  rp.RoleId   = @RoleId
              )
      )
    ORDER BY DisplayOrder;
END
GO
