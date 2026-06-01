SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Returns admin sidebar items the user can SEE (IsVisible=1 + has permission).
--
-- PortalScope supports comma-separated portal types (e.g. 'admin,rider').
--   NULL       = visible in ALL portals
--   'admin'    = admin portal only
--   'rider'    = rider portal only
--   'admin,rider' = both portals
--
-- Visibility is checked with STRING_SPLIT so a single nav item can appear
-- in multiple portals simultaneously — configurable from /admin/nav.
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
      -- Permission check
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
      -- Portal scope check (supports comma-separated list, e.g. 'admin,rider')
      AND (
              PortalScope IS NULL
          OR  EXISTS (
                  SELECT 1 FROM STRING_SPLIT(PortalScope, ',')
                  WHERE  TRIM(value) = @PortalType
              )
      )
    ORDER BY DisplayOrder;
END
GO
