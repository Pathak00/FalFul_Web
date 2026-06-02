USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_PasswordResetToken_Create
    @UserId    INT,
    @TokenHash NVARCHAR(256),
    @ExpiresAt DATETIME2,
    @IpAddress NVARCHAR(64) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Invalidate any previous unused reset tokens for this user
    UPDATE PasswordResetTokens
    SET IsUsed = 1
    WHERE UserId = @UserId AND IsUsed = 0;

    INSERT INTO PasswordResetTokens (UserId, TokenHash, ExpiresAt, IpAddress)
    VALUES (@UserId, @TokenHash, @ExpiresAt, @IpAddress);

    SELECT SCOPE_IDENTITY() AS Id;
END
GO
