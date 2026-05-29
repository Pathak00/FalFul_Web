USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_MenuItem_GetVisible
    @UserId INT = NULL  -- NULL = guest
AS
BEGIN
    SET NOCOUNT ON;
    SELECT m.Id, m.ParentId, m.Label, m.Url, m.Icon, m.DisplayOrder, m.IsVisible, m.VisibleTo, m.OpenInNewTab,
           ISNULL(STRING_AGG(CAST(mr.RoleId AS NVARCHAR), ','), '') AS RequiredRoleIds
    FROM MenuItems m
    LEFT JOIN MenuItemRoles mr ON mr.MenuItemId = m.Id
    WHERE m.IsDeleted = 0
      AND m.IsVisible = 1
      AND (
            m.VisibleTo = 0
         OR (@UserId IS NULL     AND m.VisibleTo = 2)
         OR (@UserId IS NOT NULL AND m.VisibleTo = 1)
         OR (@UserId IS NOT NULL AND m.VisibleTo = 3
             AND EXISTS (
                 SELECT 1 FROM UserRoles ur
                 JOIN MenuItemRoles mr2 ON mr2.RoleId = ur.RoleId
                 WHERE ur.UserId = @UserId AND mr2.MenuItemId = m.Id
             ))
      )
    GROUP BY m.Id, m.ParentId, m.Label, m.Url, m.Icon, m.DisplayOrder, m.IsVisible, m.VisibleTo, m.OpenInNewTab
    ORDER BY ISNULL(m.ParentId, m.Id), m.ParentId, m.DisplayOrder;
END
GO
