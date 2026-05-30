USE FalFulDb;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE sp_RefreshToken_Revoke
    @Token NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE RefreshTokens
    SET IsRevoked = 1, UpdatedAt = dbo.fn_NepalNow()
    WHERE Token = @Token;
END
GO


