SET QUOTED_IDENTIFIER ON
GO
-- Assigns a role to a user (replaces any previous assignment).
-- UserType sync removed â€” access control is driven by permissions only.
CREATE OR ALTER PROCEDURE sp_UserRole_Assign
    @UserId     INT,
    @RoleId     INT,
    @AssignedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DELETE FROM UserRoles WHERE UserId = @UserId;

    INSERT INTO UserRoles (UserId, RoleId, AssignedBy)
    VALUES (@UserId, @RoleId, @AssignedBy);

    UPDATE Users SET UpdatedAt = dbo.fn_NepalNow() WHERE Id = @UserId;
END

