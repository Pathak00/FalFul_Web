SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Product_Create
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
    @DisplayOrder     INT            = 0,
    @MinOrderGrams    INT            = NULL,
    @GramStep         INT            = NULL,
    @CutFruitPrice    DECIMAL(10,2)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    IF EXISTS (SELECT 1 FROM Products WHERE Slug = @Slug AND IsDeleted = 0)
    BEGIN
        RAISERROR('A product with this slug already exists.', 16, 1);
        RETURN;
    END

    INSERT INTO Products (CategoryId, Name, Slug, Description, ShortDescription, Price, Unit,
                          Stock, IsAvailable, IsFeatured, ImageUrl, Tags, DisplayOrder,
                          MinOrderGrams, GramStep, CutFruitPrice, CreatedAt)
    VALUES (@CategoryId, @Name, @Slug, @Description, @ShortDescription, @Price, @Unit,
            @Stock, @IsAvailable, @IsFeatured, @ImageUrl, @Tags, @DisplayOrder,
            @MinOrderGrams, @GramStep, @CutFruitPrice, GETUTCDATE());

    SELECT SCOPE_IDENTITY() AS Id;
END
