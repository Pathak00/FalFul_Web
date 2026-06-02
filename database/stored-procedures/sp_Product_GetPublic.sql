CREATE OR ALTER PROCEDURE sp_Product_GetPublic
    @CategoryId  INT  = NULL,
    @SearchTerm  NVARCHAR(100) = NULL,
    @FeaturedOnly BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.CategoryId, c.Name AS CategoryName, p.Name, p.Slug,
           p.ShortDescription, p.Price, p.Mrp, p.Unit, p.Stock,
           p.IsAvailable, p.IsFeatured, p.ImageUrl, p.Tags, p.DisplayOrder,
           p.MinOrderGrams, p.GramStep, p.CutFruitPrice, p.ShowInCatalog
    FROM   Products p
    INNER  JOIN Categories c ON c.Id = p.CategoryId
    WHERE  p.IsDeleted      = 0
      AND  p.IsAvailable    = 1
      AND  p.ShowInCatalog  = 1
      AND  c.IsActive       = 1
      AND  (@CategoryId   IS NULL OR p.CategoryId = @CategoryId)
      AND  (@FeaturedOnly = 0     OR p.IsFeatured = 1)
      AND  (@SearchTerm   IS NULL OR p.Name LIKE '%' + @SearchTerm + '%' OR p.Tags LIKE '%' + @SearchTerm + '%')
    ORDER  BY p.IsFeatured DESC, p.DisplayOrder, p.Name;
END
