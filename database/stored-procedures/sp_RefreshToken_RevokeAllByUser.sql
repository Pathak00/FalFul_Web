USE FalFulDb;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE sp_RefreshToken_RevokeAllByUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE RefreshTokens
    SET IsRevoked = 1, UpdatedAt = GETUTCDATE()
    WHERE UserId = @UserId AND IsRevoked = 0;
END
GO

