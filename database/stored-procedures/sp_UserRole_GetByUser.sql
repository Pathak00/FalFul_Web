SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_UserRole_GetByUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.Id, r.Name, r.NormalizedName, r.Description
    FROM   UserRoles ur
    JOIN   Roles r ON r.Id = ur.RoleId
    WHERE  ur.UserId = @UserId;
END
