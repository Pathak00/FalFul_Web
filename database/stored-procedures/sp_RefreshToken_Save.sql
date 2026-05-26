USE FalFulDb;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE sp_RefreshToken_Save
    @UserId     INT,
    @Token      NVARCHAR(256),
    @ExpiresAt  DATETIME2,
    @DeviceInfo NVARCHAR(200) = NULL,
    @IpAddress  NVARCHAR(50)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO RefreshTokens (UserId, Token, ExpiresAt, DeviceInfo, IpAddress, CreatedAt)
    VALUES (@UserId, @Token, @ExpiresAt, @DeviceInfo, @IpAddress, GETUTCDATE());
END
GO

