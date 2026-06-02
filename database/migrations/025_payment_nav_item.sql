-- Migration 025: Add Payments nav item + payments permission
-- Inserts the admin sidebar entry for the payments management page.

BEGIN TRANSACTION;

-- Nav item: appears in Operations group, between Reports and Price Config
INSERT INTO AdminNavItems (Label, Route, Icon, GroupLabel, DisplayOrder, RequiredPermission, IsSystem)
VALUES ('Payments', '/admin/payments', 'bi-credit-card-2-front', 'Operations', 85, NULL, 1);

COMMIT TRANSACTION;
