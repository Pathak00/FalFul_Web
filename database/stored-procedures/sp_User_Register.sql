USE FalFulDb;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE sp_User_Register
    @FullName        NVARCHAR(100),
    @Email           NVARCHAR(150)  = NULL,
    @PhoneNumber     NVARCHAR(20)   = NULL,
    @PasswordHash    NVARCHAR(256)  = NULL,
    @UserType        TINYINT        = 1
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, UserType, CreatedAt)
    VALUES (@FullName, @Email, @PhoneNumber, @PasswordHash, @UserType, dbo.fn_NepalNow());

    SELECT SCOPE_IDENTITY();
END
GO


