-- REMOVED in migration 020 (pure RBAC).
-- sp_UserPermission_GetUserSpecific returned user-level permission overrides.
-- User-level permissions no longer exist; permissions are role-only.
-- This file is kept as a tombstone. The SP is dropped by migration 020 via table drop cascade.
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('sp_UserPermission_GetUserSpecific', 'P') IS NOT NULL
    DROP PROCEDURE sp_UserPermission_GetUserSpecific;
GO
