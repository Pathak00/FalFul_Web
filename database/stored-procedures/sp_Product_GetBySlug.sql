CREATE OR ALTER PROCEDURE sp_Product_GetBySlug
    @Slug NVARCHAR(220)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.CategoryId, c.Name AS CategoryName, p.Name, p.Slug,
           p.ShortDescription, p.Description, p.Price, p.Mrp, p.Unit,
           p.Stock, p.IsAvailable, p.IsFeatured, p.ImageUrl,
           p.Tags, p.DisplayOrder, p.MinOrderGrams, p.GramStep, p.CutFruitPrice,
           p.ShowInCatalog, p.CreatedAt, p.UpdatedAt
    FROM   Products p
    INNER  JOIN Categories c ON c.Id = p.CategoryId
    WHERE  p.Slug = @Slug AND p.IsDeleted = 0;
END
