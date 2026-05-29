SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_UserPermission_SetForStaff
    @UserId      INT,
    @Permissions NVARCHAR(MAX),  -- comma-separated permission names, empty string = clear all
    @GrantedBy   INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DELETE FROM UserPermissions WHERE UserId = @UserId;

    IF LEN(LTRIM(RTRIM(@Permissions))) > 0
    BEGIN
        INSERT INTO UserPermissions (UserId, PermissionId, Granted, GrantedBy)
        SELECT @UserId, p.Id, 1, @GrantedBy
        FROM   Permissions p
        WHERE  p.Name IN (
            SELECT LTRIM(RTRIM(value))
            FROM   STRING_SPLIT(@Permissions, ',')
            WHERE  LEN(LTRIM(RTRIM(value))) > 0
        );
    END
END
