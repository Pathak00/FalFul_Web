USE FalFulDb;
GO

CREATE OR ALTER PROCEDURE sp_RefreshToken_Get
    @Token NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, UserId, Token, ExpiresAt, IsRevoked, DeviceInfo, IpAddress, CreatedAt
    FROM RefreshTokens
    WHERE Token = @Token AND IsDeleted = 0;
END
GO
