USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_MenuItem_SetRoles
    @MenuItemId INT,
    @RoleIds    NVARCHAR(MAX) = NULL  -- comma-separated role IDs; NULL or empty clears all
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM MenuItemRoles WHERE MenuItemId = @MenuItemId;
    IF @RoleIds IS NOT NULL AND LEN(@RoleIds) > 0
        INSERT INTO MenuItemRoles (MenuItemId, RoleId)
        SELECT @MenuItemId, CAST(value AS INT)
        FROM STRING_SPLIT(@RoleIds, ',')
        WHERE LTRIM(value) != '';
END
GO
