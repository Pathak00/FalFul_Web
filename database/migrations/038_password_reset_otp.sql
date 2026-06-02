-- =============================================================================
-- Migration 038: Password Reset via OTP
--
-- Adds:
--   1. PasswordResetOtps    — stores hashed 6-digit OTPs (10-min expiry)
--   2. PasswordResetTokens  — short-lived token issued after OTP verified (15-min)
-- =============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRANSACTION;

-- ── 1. PasswordResetOtps ─────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PasswordResetOtps')
BEGIN
    CREATE TABLE PasswordResetOtps (
        Id          INT           IDENTITY(1,1) PRIMARY KEY,
        UserId      INT           NOT NULL REFERENCES Users(Id),
        OtpHash     NVARCHAR(256) NOT NULL,         -- BCrypt hash of 6-digit OTP
        Channel     TINYINT       NOT NULL,          -- 1=Email  2=SMS
        Destination NVARCHAR(256) NOT NULL,          -- email address or phone number
        ExpiresAt   DATETIME2     NOT NULL,
        IsUsed      BIT           NOT NULL DEFAULT 0,
        AttemptCount INT          NOT NULL DEFAULT 0,
        IpAddress   NVARCHAR(64)  NULL,
        CreatedAt   DATETIME2     NOT NULL DEFAULT (DATEADD(MINUTE, 345, GETUTCDATE()))
    );

    CREATE INDEX IX_PROtps_UserId    ON PasswordResetOtps(UserId)    WHERE IsUsed = 0;
    CREATE INDEX IX_PROtps_CreatedAt ON PasswordResetOtps(CreatedAt);

    PRINT 'PasswordResetOtps table created.';
END
ELSE
    PRINT 'PasswordResetOtps table already exists.';

-- ── 2. PasswordResetTokens ───────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PasswordResetTokens')
BEGIN
    CREATE TABLE PasswordResetTokens (
        Id        INT           IDENTITY(1,1) PRIMARY KEY,
        UserId    INT           NOT NULL REFERENCES Users(Id),
        TokenHash NVARCHAR(256) NOT NULL,             -- SHA-256 of the raw token
        ExpiresAt DATETIME2     NOT NULL,
        IsUsed    BIT           NOT NULL DEFAULT 0,
        IpAddress NVARCHAR(64)  NULL,
        CreatedAt DATETIME2     NOT NULL DEFAULT (DATEADD(MINUTE, 345, GETUTCDATE()))
    );

    CREATE INDEX IX_PRTokens_TokenHash ON PasswordResetTokens(TokenHash) WHERE IsUsed = 0;
    CREATE INDEX IX_PRTokens_UserId    ON PasswordResetTokens(UserId)    WHERE IsUsed = 0;

    PRINT 'PasswordResetTokens table created.';
END
ELSE
    PRINT 'PasswordResetTokens table already exists.';

COMMIT TRANSACTION;
