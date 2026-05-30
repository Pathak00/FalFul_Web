-- Migration 021: Customer dashboard + fix public menu visibility
--
-- Problems this fixes:
--   1. "Dashboard" menu item is VisibleTo=1 (AnyLoggedIn) — admins and riders
--      see it in the public navbar even though it is a customer-only page.
--   2. "Admin" and its sub-items were migrated to VisibleTo=1 in migration 013,
--      so customer/rider users incorrectly see Admin links in the public navbar.
--   3. No "My Orders" customer shortcut exists in the public navbar.
--
-- Fix: move Dashboard, My Orders, Admin top-item and Admin sub-items to
--      VisibleTo=3 (SpecificRoles) and wire them to the appropriate roles via
--      the MenuItemRoles junction table introduced in migration 014.

BEGIN TRANSACTION;

DECLARE @CustomerRoleId INT;
DECLARE @AdminRoleId    INT;

SELECT @CustomerRoleId = Id FROM Roles WHERE NormalizedName = 'CUSTOMER';
-- Support both 'ADMIN' and 'SUPERADMIN' naming conventions across environments.
SELECT TOP 1 @AdminRoleId = Id FROM Roles WHERE NormalizedName IN ('ADMIN','SUPERADMIN') ORDER BY Id;

-- ── 1. Dashboard → Customer only ─────────────────────────────────────────────
UPDATE MenuItems
SET    VisibleTo = 3
WHERE  Url       = '/dashboard'
  AND  IsDeleted = 0;

INSERT INTO MenuItemRoles (MenuItemId, RoleId)
SELECT m.Id, @CustomerRoleId
FROM   MenuItems m
WHERE  m.Url = '/dashboard' AND m.IsDeleted = 0
  AND  NOT EXISTS (
           SELECT 1 FROM MenuItemRoles mr
           WHERE  mr.MenuItemId = m.Id AND mr.RoleId = @CustomerRoleId
       );

-- ── 2. My Orders → Customer only (add if missing, fix VisibleTo if present) ──
IF NOT EXISTS (SELECT 1 FROM MenuItems WHERE Url = '/orders' AND IsDeleted = 0)
BEGIN
    DECLARE @OrdersId INT;

    INSERT INTO MenuItems (Label, Url, Icon, DisplayOrder, IsVisible, VisibleTo, OpenInNewTab)
    VALUES ('My Orders', '/orders', 'bi-bag-check-fill', 50, 1, 3, 0);

    SET @OrdersId = SCOPE_IDENTITY();

    INSERT INTO MenuItemRoles (MenuItemId, RoleId)
    VALUES (@OrdersId, @CustomerRoleId);
END
ELSE
BEGIN
    UPDATE MenuItems SET VisibleTo = 3 WHERE Url = '/orders' AND IsDeleted = 0;

    INSERT INTO MenuItemRoles (MenuItemId, RoleId)
    SELECT m.Id, @CustomerRoleId
    FROM   MenuItems m
    WHERE  m.Url = '/orders' AND m.IsDeleted = 0
      AND  NOT EXISTS (
               SELECT 1 FROM MenuItemRoles mr
               WHERE  mr.MenuItemId = m.Id AND mr.RoleId = @CustomerRoleId
           );
END

-- ── 3. Admin top-level item → Admin only ─────────────────────────────────────
UPDATE MenuItems
SET    VisibleTo = 3
WHERE  Url       = '/admin'
  AND  ParentId  IS NULL
  AND  IsDeleted = 0;

INSERT INTO MenuItemRoles (MenuItemId, RoleId)
SELECT m.Id, @AdminRoleId
FROM   MenuItems m
WHERE  m.Url = '/admin' AND m.ParentId IS NULL AND m.IsDeleted = 0
  AND  NOT EXISTS (
           SELECT 1 FROM MenuItemRoles mr
           WHERE  mr.MenuItemId = m.Id AND mr.RoleId = @AdminRoleId
       );

-- ── 4. Admin sub-items → Admin only ──────────────────────────────────────────
UPDATE MenuItems
SET    VisibleTo = 3
WHERE  IsDeleted = 0
  AND  ParentId IN (
           SELECT Id FROM MenuItems
           WHERE  Url = '/admin' AND ParentId IS NULL AND IsDeleted = 0
       );

INSERT INTO MenuItemRoles (MenuItemId, RoleId)
SELECT m.Id, @AdminRoleId
FROM   MenuItems m
WHERE  m.IsDeleted = 0
  AND  m.ParentId IN (
           SELECT Id FROM MenuItems
           WHERE  Url = '/admin' AND ParentId IS NULL AND IsDeleted = 0
       )
  AND  NOT EXISTS (
           SELECT 1 FROM MenuItemRoles mr
           WHERE  mr.MenuItemId = m.Id AND mr.RoleId = @AdminRoleId
       );

COMMIT TRANSACTION;
