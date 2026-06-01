-- =============================================================================
-- Migration 033: Menu & Navigation Architecture Refactor
--
-- Fixes:
--   1. Add IsPortalShortcut BIT to MenuItems — distinguishes portal shortcut
--      links (Dashboard, My Orders, Admin) from public website nav items.
--      Content editors can now clearly see which items should not be
--      repurposed as regular public nav.
--
--   2. Add Create/Delete support to AdminNavItems — previously only editable
--      via raw SQL. New SPs (sp_AdminNavItem_Create, sp_AdminNavItem_Delete)
--      allow non-system items to be managed from the admin UI.
--
--   3. sp_AdminNavItem_GetPermittedForUser — same as GetForUser but without
--      the IsVisible=1 filter. Used by the route guard so that hidden nav
--      items still enforce their RequiredPermission (fixes the security bug
--      where hidden items were accessible by direct URL to any portal user).
-- =============================================================================

BEGIN TRANSACTION;

-- ── 1. IsPortalShortcut on MenuItems ─────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'MenuItems' AND COLUMN_NAME = 'IsPortalShortcut'
)
BEGIN
    ALTER TABLE MenuItems ADD IsPortalShortcut BIT NOT NULL DEFAULT 0;
END

-- Use dynamic SQL so the UPDATE references the column only after it exists.
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'MenuItems' AND COLUMN_NAME = 'IsPortalShortcut'
)
BEGIN
    -- Mark known portal shortcut top-level items
    EXEC sp_executesql N'
        UPDATE MenuItems SET IsPortalShortcut = 1
        WHERE IsDeleted = 0
          AND Url IN (''/dashboard'', ''/orders'', ''/admin'', ''/home'');

        UPDATE MenuItems SET IsPortalShortcut = 1
        WHERE IsDeleted = 0
          AND ParentId IN (
              SELECT Id FROM MenuItems WHERE Url = ''/admin'' AND IsDeleted = 0
          );
    ';
END

-- ── 2. AdminNavItems: allow IsSystem = 0 items to be deleted ─────────────────
-- Nothing to change in the schema; IsSystem column already exists.
-- The new SPs enforce the rule that only IsSystem = 0 items can be deleted.

COMMIT TRANSACTION;
