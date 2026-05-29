-- Migration 017: Default registration role safety net
-- Guarantees a default registration role exists so AssignCustomerRoleAsync never silently no-ops.
-- Also corrects migration 015 which mistakenly targeted 'SUPERADMIN' instead of 'ADMIN'
-- for the shop permission, leaving Admin without it.

BEGIN TRANSACTION;

-- Ensure at least one role is flagged as the default registration role.
-- If none is set (e.g. fresh install before admin configured it), fall back to Customer.
IF NOT EXISTS (SELECT 1 FROM Roles WHERE IsDefault = 1)
BEGIN
    UPDATE Roles SET IsDefault = 1 WHERE NormalizedName = 'CUSTOMER';
END

-- Grant shop permission to Admin role (omitted from migration 015).
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM   Roles r
CROSS  JOIN Permissions p
WHERE  p.Name     = 'shop'
  AND  r.NormalizedName = 'ADMIN'
  AND  NOT EXISTS (
      SELECT 1 FROM RolePermissions rp
      WHERE  rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );

COMMIT TRANSACTION;
