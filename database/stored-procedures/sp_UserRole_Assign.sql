SET QUOTED_IDENTIFIER ON
GO
-- Assigns a role to a user (replaces any previous assignment).
-- UserType sync removed — access control is driven by permissions only.
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

    UPDATE Users SET UpdatedAt = GETUTCDATE() WHERE Id = @UserId;
END
