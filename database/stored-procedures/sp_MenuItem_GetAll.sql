USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_MenuItem_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT m.Id, m.ParentId, m.Label, m.Url, m.Icon, m.DisplayOrder, m.IsVisible, m.VisibleTo, m.OpenInNewTab,
           ISNULL(STRING_AGG(CAST(mr.RoleId AS NVARCHAR), ','), '') AS RequiredRoleIds
    FROM MenuItems m
    LEFT JOIN MenuItemRoles mr ON mr.MenuItemId = m.Id
    WHERE m.IsDeleted = 0
    GROUP BY m.Id, m.ParentId, m.Label, m.Url, m.Icon, m.DisplayOrder, m.IsVisible, m.VisibleTo, m.OpenInNewTab
    ORDER BY ISNULL(m.ParentId, m.Id), m.ParentId, m.DisplayOrder;
END
GO
