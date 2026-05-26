SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Product_Update
    @Id               INT,
    @CategoryId       INT,
    @Name             NVARCHAR(200),
    @Slug             NVARCHAR(220),
    @Description      NVARCHAR(2000) = NULL,
    @ShortDescription NVARCHAR(300)  = NULL,
    @Price            DECIMAL(10,2),
    @Unit             NVARCHAR(20)   = 'KG',
    @Stock            DECIMAL(10,2)  = 0,
    @IsAvailable      BIT            = 1,
    @IsFeatured       BIT            = 0,
    @ImageUrl         NVARCHAR(500)  = NULL,
    @Tags             NVARCHAR(500)  = NULL,
    @DisplayOrder     INT            = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    IF EXISTS (SELECT 1 FROM Products WHERE Slug = @Slug AND Id <> @Id AND IsDeleted = 0)
    BEGIN
        RAISERROR('A product with this slug already exists.', 16, 1);
        RETURN;
    END

    UPDATE Products
    SET    CategoryId       = @CategoryId,
           Name             = @Name,
           Slug             = @Slug,
           Description      = @Description,
           ShortDescription = @ShortDescription,
           Price            = @Price,
           Unit             = @Unit,
           Stock            = @Stock,
           IsAvailable      = @IsAvailable,
           IsFeatured       = @IsFeatured,
           ImageUrl         = @ImageUrl,
           Tags             = @Tags,
           DisplayOrder     = @DisplayOrder,
           UpdatedAt        = GETUTCDATE()
    WHERE  Id = @Id AND IsDeleted = 0;
END
