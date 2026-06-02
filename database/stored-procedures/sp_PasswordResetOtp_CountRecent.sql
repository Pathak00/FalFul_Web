USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Returns the number of OTP requests made by a user OR from an IP
-- within the last @WindowMinutes minutes. Used for rate limiting.
CREATE OR ALTER PROCEDURE sp_PasswordResetOtp_CountRecent
    @UserId        INT          = NULL,
    @IpAddress     NVARCHAR(64) = NULL,
    @WindowMinutes INT          = 15
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Since DATETIME2 = DATEADD(MINUTE, -@WindowMinutes, DATEADD(MINUTE, 345, GETUTCDATE()));

    SELECT COUNT(*) AS RecentCount
    FROM PasswordResetOtps
    WHERE CreatedAt >= @Since
      AND (
            (@UserId    IS NOT NULL AND UserId    = @UserId)
         OR (@IpAddress IS NOT NULL AND IpAddress = @IpAddress)
          );
END
GO
