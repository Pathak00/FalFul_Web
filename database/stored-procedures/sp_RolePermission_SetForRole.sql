SET QUOTED_IDENTIFIER ON
GO
-- Replaces the full permission set for a role.
-- @PermissionIds: comma-separated list of Permission IDs (empty string = clear all)
CREATE OR ALTER PROCEDURE sp_RolePermission_SetForRole
    @RoleId        INT,
    @PermissionIds NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DELETE FROM RolePermissions WHERE RoleId = @RoleId;

    IF LEN(TRIM(@PermissionIds)) > 0
    BEGIN
        INSERT INTO RolePermissions (RoleId, PermissionId)
        SELECT @RoleId, CAST(value AS INT)
        FROM   STRING_SPLIT(@PermissionIds, ',')
        WHERE  TRIM(value) <> '';
    END
END
