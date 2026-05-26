USE FalFulDb;
GO

CREATE OR ALTER PROCEDURE sp_Organization_ExistsByName
    @Name NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(1) FROM Organizations WHERE Name = @Name AND IsDeleted = 0;
END
GO
