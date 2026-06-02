USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_User_UpdatePassword
    @UserId       INT,
    @PasswordHash NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET PasswordHash = @PasswordHash,
        UpdatedAt    = dbo.fn_NepalNow()
    WHERE Id = @UserId AND IsDeleted = 0;
END
GO
