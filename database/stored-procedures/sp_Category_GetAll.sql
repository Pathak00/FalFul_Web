CREATE OR ALTER PROCEDURE sp_Category_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Slug, Description, Icon, ImageUrl, DisplayOrder, IsActive, CreatedAt, UpdatedAt
    FROM   Categories
    ORDER  BY DisplayOrder, Name;
END
