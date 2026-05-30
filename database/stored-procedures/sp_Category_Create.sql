SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Category_Create
    @Name        NVARCHAR(100),
    @Slug        NVARCHAR(120),
    @Description NVARCHAR(500)  = NULL,
    @Icon        NVARCHAR(60)   = NULL,
    @ImageUrl    NVARCHAR(500)  = NULL,
    @DisplayOrder INT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    IF EXISTS (SELECT 1 FROM Categories WHERE Slug = @Slug)
    BEGIN
        RAISERROR('A category with this slug already exists.', 16, 1);
        RETURN;
    END

    INSERT INTO Categories (Name, Slug, Description, Icon, ImageUrl, DisplayOrder, IsActive, CreatedAt)
    VALUES (@Name, @Slug, @Description, @Icon, @ImageUrl, @DisplayOrder, 1, dbo.fn_NepalNow());

    SELECT SCOPE_IDENTITY() AS Id;
END

