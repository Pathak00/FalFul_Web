SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_RolePermission_GetForRole
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Name, p.DisplayName, p.Category, p.SortOrder
    FROM   Permissions p
    JOIN   RolePermissions rp ON rp.PermissionId = p.Id
    WHERE  rp.RoleId = @RoleId
    ORDER  BY p.SortOrder;
END
