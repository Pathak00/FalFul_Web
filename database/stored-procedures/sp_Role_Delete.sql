USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Role_Delete
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Roles WHERE Id = @RoleId AND IsDefault = 1)
    BEGIN
        RAISERROR ('Cannot delete the default role.', 16, 1);
        RETURN;
    END
    DELETE FROM RolePermissions WHERE RoleId = @RoleId;
    DELETE FROM UserRoles         WHERE RoleId = @RoleId;
    DELETE FROM Roles             WHERE Id = @RoleId;
END
GO
