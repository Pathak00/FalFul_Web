USE FalFulDb;
GO

CREATE OR ALTER PROCEDURE sp_User_ExistsByPhone
    @PhoneNumber NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(1) FROM Users WHERE PhoneNumber = @PhoneNumber AND IsDeleted = 0;
END
GO
