USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_User_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, FullName, Email, PhoneNumber, UserType, IsActive, CreatedAt, LastLoginAt
    FROM Users
    WHERE IsDeleted = 0
    ORDER BY CreatedAt DESC;
END
GO
