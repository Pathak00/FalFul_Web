-- Migration 020: Pure RBAC — remove UserPermissions (user-level permission overrides)
--
-- Authorization is now exclusively role-based:
--   Users → Role → RolePermissions → Permissions
--
-- The UserPermissions table (per-user overrides) is dropped entirely.
-- All effective permission lookups now use RolePermissions only.

BEGIN TRANSACTION;

-- Drop user-level permission overrides table (FK refs users and permissions)
IF OBJECT_ID('UserPermissions', 'U') IS NOT NULL
    DROP TABLE UserPermissions;

COMMIT TRANSACTION;
