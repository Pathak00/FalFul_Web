-- =============================================================================
-- Migration 034: PortalScope on AdminNavItems + fix missing RequiredPermissions
--
-- Two problems this migration fixes:
--
-- 1. AdminNavItems has no concept of which portal an item belongs to.
--    The "Dashboard" item has RequiredPermission = NULL which correctly
--    means "no permission needed". But Payments/Discounts/Notices also had
--    RequiredPermission = NULL, meaning they appeared in EVERY portal —
--    including the rider portal — because NULL passes the permission check.
--
-- 2. Payments, Discounts, and Notices were seeded without RequiredPermission
--    in their original migrations (024, 028). This was an oversight.
--
-- Solution: Add PortalScope NVARCHAR(20) NULL to AdminNavItems.
--
--   PortalScope = NULL    → item appears in ALL portals (admin + rider)
--   PortalScope = 'admin' → item appears only in the admin portal
--   PortalScope = 'rider' → item appears only in the rider portal
--
-- The stored procedures (GetForUser, GetPermittedForUser) are updated to
-- join with Roles via UserRoles to get the user's PortalType, then filter
-- items by PortalScope. This keeps everything DB-driven — no hardcoded
-- portal type checks in application code.
-- =============================================================================

BEGIN TRANSACTION;

-- ── 1. Add PortalScope column ─────────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'AdminNavItems' AND COLUMN_NAME = 'PortalScope'
)
BEGIN
    ALTER TABLE AdminNavItems ADD PortalScope NVARCHAR(20) NULL;
    -- NULL = all portals (default, preserves backward compatibility)
END

COMMIT TRANSACTION;

-- Separate batch using dynamic SQL so the UPDATE references the new column after ALTER completes
BEGIN TRANSACTION;
EXEC sp_executesql N'
    -- Dashboard → NULL (all portals)
    UPDATE AdminNavItems SET PortalScope = NULL WHERE Route = ''/admin'';
    -- Deliveries → NULL (admin and rider both need deliveries)
    UPDATE AdminNavItems SET PortalScope = NULL WHERE Route = ''/admin/deliveries'';
    -- Everything else → admin portal only
    UPDATE AdminNavItems SET PortalScope = ''admin'' WHERE Route NOT IN (''/admin'', ''/admin/deliveries'') AND PortalScope IS NULL;
    -- Fix missing RequiredPermission on items seeded without one (oversight in migrations 024/028)
    UPDATE AdminNavItems SET RequiredPermission = ''payments''  WHERE Route = ''/admin/payments''  AND RequiredPermission IS NULL;
    UPDATE AdminNavItems SET RequiredPermission = ''discounts'' WHERE Route = ''/admin/discounts'' AND RequiredPermission IS NULL;
    UPDATE AdminNavItems SET RequiredPermission = ''notices''   WHERE Route = ''/admin/notices''   AND RequiredPermission IS NULL;
';
COMMIT TRANSACTION;
