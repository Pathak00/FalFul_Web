USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Page_GetBySlug
    @Slug        NVARCHAR(200),
    @AdminMode   BIT = 0   -- 1 = return even unpublished (admin preview)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Title, Slug, Content, MetaTitle, MetaDescription, IsPublished, CreatedAt, UpdatedAt
    FROM Pages
    WHERE Slug = @Slug
      AND IsDeleted = 0
      AND (@AdminMode = 1 OR IsPublished = 1);
END
GO
