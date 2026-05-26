USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Admin_ResetPassword
    @UserId       INT,
    @PasswordHash NVARCHAR(256),
    @UpdatedBy    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET PasswordHash = @PasswordHash, UpdatedAt = GETUTCDATE(), UpdatedBy = @UpdatedBy
    WHERE Id = @UserId AND IsDeleted = 0;
END
GO
