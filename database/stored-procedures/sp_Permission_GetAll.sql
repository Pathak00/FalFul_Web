SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Permission_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, DisplayName, Category, SortOrder
    FROM   Permissions
    ORDER BY SortOrder;
END
