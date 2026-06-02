USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_PasswordResetOtp_GetActive
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        Id, UserId, OtpHash, Channel, Destination,
        ExpiresAt, IsUsed, AttemptCount, IpAddress, CreatedAt
    FROM PasswordResetOtps
    WHERE UserId  = @UserId
      AND IsUsed  = 0
      AND ExpiresAt > DATEADD(MINUTE, 345, GETUTCDATE())
    ORDER BY CreatedAt DESC;
END
GO
