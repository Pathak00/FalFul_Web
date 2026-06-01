-- =============================================================================
-- Migration 035: RequiredPortalType on MenuItems
--
-- Problem: Portal shortcuts in the public navbar (Dashboard, My Orders, Admin)
-- use VisibleTo=3 + MenuItemRoles (direct role-ID assignment). When a new role
-- is created with portalType='admin' (e.g. "Warehouse Manager"), it must be
-- manually added to MenuItemRoles for the Admin shortcut to appear in the navbar.
--
-- Solution: Add RequiredPortalType NVARCHAR(20) NULL to MenuItems.
--
--   RequiredPortalType = NULL        → use existing VisibleTo logic (no change)
--   RequiredPortalType = 'admin'     → show to any logged-in user whose role's
--                                      PortalType = 'admin'
--   RequiredPortalType = 'customer'  → show to any user with PortalType = 'customer'
--   RequiredPortalType = 'rider'     → show to any user with PortalType = 'rider'
--
-- sp_MenuItem_GetVisible is updated to use this column for IsPortalShortcut=1
-- items, replacing the MenuItemRoles join for those items. This means:
--   - Any future role with portalType='admin' automatically sees the Admin link
--   - Any future role with portalType='customer' automatically sees Dashboard
--   - No manual MenuItemRoles maintenance needed for new roles
--
-- The existing MenuItemRoles entries are kept for backward compatibility with
-- non-shortcut items that use VisibleTo=3.
-- =============================================================================

BEGIN TRANSACTION;

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'MenuItems' AND COLUMN_NAME = 'RequiredPortalType'
)
BEGIN
    ALTER TABLE MenuItems ADD RequiredPortalType NVARCHAR(20) NULL;
END

COMMIT TRANSACTION;

-- Use dynamic SQL to reference the new column after ALTER completes
BEGIN TRANSACTION;

EXEC sp_executesql N'
    -- Customer portal shortcuts: visible to any customer-portal user
    UPDATE MenuItems
    SET RequiredPortalType = ''customer''
    WHERE IsPortalShortcut = 1
      AND IsDeleted = 0
      AND Url IN (''/dashboard'', ''/orders'', ''/home'');

    -- Admin portal shortcuts: visible to any admin-portal user
    UPDATE MenuItems
    SET RequiredPortalType = ''admin''
    WHERE IsPortalShortcut = 1
      AND IsDeleted = 0
      AND Url = ''/admin''
      AND ParentId IS NULL;

    -- Admin sub-items: same
    UPDATE MenuItems
    SET RequiredPortalType = ''admin''
    WHERE IsPortalShortcut = 1
      AND IsDeleted = 0
      AND RequiredPortalType IS NULL;
';

COMMIT TRANSACTION;
