SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Category_Update
    @Id          INT,
    @Name        NVARCHAR(100),
    @Slug        NVARCHAR(120),
    @Description NVARCHAR(500) = NULL,
    @Icon        NVARCHAR(60)  = NULL,
    @ImageUrl    NVARCHAR(500) = NULL,
    @DisplayOrder INT          = 0,
    @IsActive    BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    IF EXISTS (SELECT 1 FROM Categories WHERE Slug = @Slug AND Id <> @Id)
    BEGIN
        RAISERROR('A category with this slug already exists.', 16, 1);
        RETURN;
    END

    UPDATE Categories
    SET    Name         = @Name,
           Slug         = @Slug,
           Description  = @Description,
           Icon         = @Icon,
           ImageUrl     = @ImageUrl,
           DisplayOrder = @DisplayOrder,
           IsActive     = @IsActive,
           UpdatedAt    = dbo.fn_NepalNow()
    WHERE  Id = @Id;
END

