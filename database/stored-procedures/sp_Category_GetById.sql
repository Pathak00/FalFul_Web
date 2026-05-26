CREATE OR ALTER PROCEDURE sp_Category_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Slug, Description, Icon, ImageUrl, DisplayOrder, IsActive, CreatedAt, UpdatedAt
    FROM   Categories
    WHERE  Id = @Id;
END
