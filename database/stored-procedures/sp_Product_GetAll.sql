CREATE OR ALTER PROCEDURE sp_Product_GetAll
    @CategoryId  INT  = NULL,
    @SearchTerm  NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.CategoryId, c.Name AS CategoryName, p.Name, p.Slug,
           p.ShortDescription, p.Description, p.Price, p.Unit,
           p.Stock, p.IsAvailable, p.IsFeatured, p.ImageUrl,
           p.Tags, p.DisplayOrder, p.CreatedAt, p.UpdatedAt
    FROM   Products p
    INNER  JOIN Categories c ON c.Id = p.CategoryId
    WHERE  p.IsDeleted = 0
      AND  (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
      AND  (@SearchTerm IS NULL OR p.Name LIKE '%' + @SearchTerm + '%' OR p.Tags LIKE '%' + @SearchTerm + '%')
    ORDER  BY p.DisplayOrder, p.Name;
END
