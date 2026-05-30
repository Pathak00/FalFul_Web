-- Migration 026: Add payments permission and grant to SuperAdmin
-- Fixes PaymentsController admin endpoints from [Authorize(Roles="Admin")]
-- to [Authorize(Policy="Perm:payments")] — the project uses permission-based auth.

BEGIN TRANSACTION;

INSERT INTO Permissions (Name, DisplayName, Category, SortOrder) VALUES ('payments', 'Payments', 'Operations', 12);

-- Grant to SuperAdmin (full access)
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM   Roles r, Permissions p
WHERE  r.Name = 'SuperAdmin' AND p.Name = 'payments';

COMMIT TRANSACTION;
