USE FalFulDb;
GO

CREATE OR ALTER PROCEDURE sp_User_GetByEmail
    @Email NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, FullName, Email, PhoneNumber, PasswordHash, UserType,
           IsActive, IsEmailVerified, IsPhoneVerified, ProfileImageUrl,
           GoogleId, LastLoginAt, IsDeleted, CreatedAt, UpdatedAt
    FROM Users
    WHERE Email = @Email AND IsDeleted = 0;
END
GO
