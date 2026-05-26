USE FalFulDb;
GO

CREATE OR ALTER PROCEDURE sp_User_GetByPhone
    @PhoneNumber NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, FullName, Email, PhoneNumber, PasswordHash, UserType,
           IsActive, IsEmailVerified, IsPhoneVerified, ProfileImageUrl,
           GoogleId, LastLoginAt, IsDeleted, CreatedAt, UpdatedAt
    FROM Users
    WHERE PhoneNumber = @PhoneNumber AND IsDeleted = 0;
END
GO
