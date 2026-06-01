SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Returns every AdminNavItem the user has permission to access (regardless of IsVisible).
-- Used by the client-side route guard so hidden items still enforce RequiredPermission.
--
-- PortalScope supports comma-separated portal types (e.g. 'admin,rider').
-- Same filtering logic as sp_AdminNavItem_GetForUser.
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
           OR  EXISTS (
                   SELECT 1 FROM STRING_SPLIT(PortalScope, ',')
                   WHERE  TRIM(value) = @PortalType
               )
           )
    ORDER BY DisplayOrder;
END
GO
