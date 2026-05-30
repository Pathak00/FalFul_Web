-- REMOVED in migration 020 (pure RBAC).
-- sp_UserPermission_SetForStaff set per-user permission overrides for Staff members.
-- User-level permissions no longer exist; permissions are managed at the role level only.
-- This file is kept as a tombstone.
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('sp_UserPermission_SetForStaff', 'P') IS NOT NULL
    DROP PROCEDURE sp_UserPermission_SetForStaff;
GO
