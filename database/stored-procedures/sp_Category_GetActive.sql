CREATE OR ALTER PROCEDURE sp_Category_GetActive
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Slug, Description, Icon, ImageUrl, DisplayOrder
    FROM   Categories
    WHERE  IsActive = 1
    ORDER  BY DisplayOrder, Name;
END
