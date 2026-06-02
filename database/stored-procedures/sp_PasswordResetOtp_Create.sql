USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_PasswordResetOtp_Create
    @UserId      INT,
    @OtpHash     NVARCHAR(256),
    @Channel     TINYINT,          -- 1=Email  2=SMS
    @Destination NVARCHAR(256),
    @ExpiresAt   DATETIME2,
    @IpAddress   NVARCHAR(64) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Invalidate any previous unused OTPs for this user
    UPDATE PasswordResetOtps
    SET IsUsed = 1
    WHERE UserId = @UserId AND IsUsed = 0;

    INSERT INTO PasswordResetOtps (UserId, OtpHash, Channel, Destination, ExpiresAt, IpAddress)
    VALUES (@UserId, @OtpHash, @Channel, @Destination, @ExpiresAt, @IpAddress);

    SELECT SCOPE_IDENTITY() AS Id;
END
GO
