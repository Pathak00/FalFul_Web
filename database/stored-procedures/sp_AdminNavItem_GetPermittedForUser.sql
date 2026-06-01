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

    DECLARE @RoleId INT;
    SELECT TOP 1 @RoleId = RoleId FROM UserRoles WHERE UserId = @UserId;

    SELECT Id, Label, Route, Icon, ParentId, GroupLabel, DisplayOrder, IsVisible, RequiredPermission, IsSystem
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
    ORDER BY DisplayOrder;
END
GO
