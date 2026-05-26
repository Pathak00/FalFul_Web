USE FalFulDb;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE sp_User_UpsertByGoogle
    @GoogleId        NVARCHAR(100),
    @Email           NVARCHAR(150),
    @FullName        NVARCHAR(100),
    @ProfileImageUrl NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserId INT;

    -- Try to find by GoogleId first
    SELECT @UserId = Id FROM Users WHERE GoogleId = @GoogleId AND IsDeleted = 0;

    IF @UserId IS NOT NULL
    BEGIN
        UPDATE Users
        SET LastLoginAt = GETUTCDATE(), UpdatedAt = GETUTCDATE()
        WHERE Id = @UserId;

        SELECT @UserId;
        RETURN;
    END

    -- Try to find by email (links Google to an existing email/password account)
    SELECT @UserId = Id FROM Users WHERE Email = @Email AND IsDeleted = 0;

    IF @UserId IS NOT NULL
    BEGIN
        UPDATE Users
        SET GoogleId        = @GoogleId,
            IsEmailVerified = 1,
            LastLoginAt     = GETUTCDATE(),
            UpdatedAt       = GETUTCDATE()
        WHERE Id = @UserId;

        SELECT @UserId;
        RETURN;
    END

    -- Create brand-new user via Google
    INSERT INTO Users (FullName, Email, GoogleId, ProfileImageUrl, UserType, IsEmailVerified, IsActive, CreatedAt, LastLoginAt)
    VALUES (@FullName, @Email, @GoogleId, @ProfileImageUrl, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

    SELECT SCOPE_IDENTITY();
END
GO
