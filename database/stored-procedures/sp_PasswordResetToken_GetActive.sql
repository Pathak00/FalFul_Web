USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_PasswordResetToken_GetActive
    @TokenHash NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        Id, UserId, TokenHash, ExpiresAt, IsUsed, IpAddress, CreatedAt
    FROM PasswordResetTokens
    WHERE TokenHash = @TokenHash
      AND IsUsed    = 0
      AND ExpiresAt > DATEADD(MINUTE, 345, GETUTCDATE());
END
GO
