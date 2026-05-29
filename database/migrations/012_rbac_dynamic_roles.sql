-- Migration 012: Dynamic RBAC
-- Removes hardcoded role-name bypasses; all access flows through permission claims.
-- Adds `system` permission and grants all permissions to Admin role via RolePermissions.
-- Adds IsDefault flag to Roles so new registrations use the DB-configured default.

BEGIN TRANSACTION;

-- ── Add `system` permission ───────────────────────────────────────────────────
INSERT INTO Permissions (Name, DisplayName, Category, SortOrder)
VALUES ('system', 'System Administration', 'Admin', 0);

-- ── Add IsDefault column to Roles ─────────────────────────────────────────────
-- Admin sets which role new registrations receive; no role name in application code.
ALTER TABLE Roles ADD IsDefault BIT NOT NULL DEFAULT 0;

UPDATE Roles SET IsDefault = 1 WHERE NormalizedName = 'CUSTOMER';

-- ── Grant ALL permissions to Admin role ───────────────────────────────────────
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM   Roles r
CROSS  JOIN Permissions p
WHERE  r.NormalizedName = 'ADMIN'
  AND  NOT EXISTS (
      SELECT 1 FROM RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );

COMMIT TRANSACTION;
