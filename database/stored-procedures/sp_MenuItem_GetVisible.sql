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
           ISNULL(m.IsPortalShortcut, 0)    AS IsPortalShortcut,
           ISNULL(m.RequiredPortalType, '') AS RequiredPortalType,
           ISNULL(STRING_AGG(CAST(mr.RoleId AS NVARCHAR), ','), '') AS RequiredRoleIds
    FROM MenuItems m
    LEFT JOIN MenuItemRoles mr ON mr.MenuItemId = m.Id
    WHERE m.IsDeleted = 0
      AND m.IsVisible = 1
      AND (
          -- ── Portal shortcuts with RequiredPortalType ──────────────────────────
          -- Show to any authenticated user whose role's PortalType matches.
          -- This eliminates manual MenuItemRoles maintenance when new roles are
          -- added: any role with portalType='admin' automatically sees the Admin
          -- link, any 'customer' role sees Dashboard and My Orders, etc.
          (m.IsPortalShortcut = 1 AND m.RequiredPortalType IS NOT NULL
           AND @UserId IS NOT NULL
           AND EXISTS (
               SELECT 1 FROM UserRoles ur
               JOIN   Roles r ON r.Id = ur.RoleId
               WHERE  ur.UserId = @UserId AND r.PortalType = m.RequiredPortalType
           ))

          OR

          -- ── All other items: existing VisibleTo logic (unchanged) ─────────────
          ((m.IsPortalShortcut = 0 OR m.RequiredPortalType IS NULL) AND (
               m.VisibleTo = 0                                               -- Everyone
            OR (@UserId IS NULL     AND m.VisibleTo = 2)                     -- Guest only
            OR (@UserId IS NOT NULL AND m.VisibleTo = 1)                     -- Any logged-in
            OR (@UserId IS NOT NULL AND m.VisibleTo = 3                      -- Specific roles
                AND EXISTS (
                    SELECT 1 FROM UserRoles ur2
                    JOIN   MenuItemRoles mr2 ON mr2.RoleId = ur2.RoleId
                    WHERE  ur2.UserId = @UserId AND mr2.MenuItemId = m.Id
                ))
          ))
      )
    GROUP BY m.Id, m.ParentId, m.Label, m.Url, m.Icon, m.DisplayOrder, m.IsVisible, m.VisibleTo,
             m.OpenInNewTab, m.IsPortalShortcut, m.RequiredPortalType
    ORDER BY ISNULL(m.ParentId, m.Id), m.ParentId, m.DisplayOrder;
END
GO
