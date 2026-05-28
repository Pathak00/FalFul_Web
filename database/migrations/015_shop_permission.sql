-- Migration 015: Shop Permission
-- Adds 'shop' as a configurable permission that controls cart/checkout access.
-- Assigned to Customer and Admin roles by default; admin can grant/revoke per role.

BEGIN TRANSACTION;

INSERT INTO Permissions (Name, DisplayName, Category, SortOrder)
VALUES ('shop', 'Shop (Cart & Checkout)', 'Customer', 13);

-- Assign to Customer and Admin roles by default (not Rider, not Staff — admin decides)
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM   Roles r
CROSS  JOIN Permissions p
WHERE  p.Name = 'shop'
  AND  r.NormalizedName IN ('CUSTOMER', 'SUPERADMIN')
  AND  NOT EXISTS (
      SELECT 1 FROM RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );

COMMIT TRANSACTION;
