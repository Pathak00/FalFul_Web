USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Page_Update
    @Id              INT,
    @Title           NVARCHAR(200),
    @Slug            NVARCHAR(200),
    @Content         NVARCHAR(MAX) = NULL,
    @MetaTitle       NVARCHAR(200) = NULL,
    @MetaDescription NVARCHAR(500) = NULL,
    @IsPublished     BIT = 0,
    @UpdatedBy       INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Pages WHERE Slug = @Slug AND Id <> @Id AND IsDeleted = 0)
    BEGIN
        RAISERROR('A page with this slug already exists.', 16, 1);
        RETURN;
    END

    UPDATE Pages
    SET Title = @Title, Slug = @Slug, Content = @Content,
        MetaTitle = @MetaTitle, MetaDescription = @MetaDescription,
        IsPublished = @IsPublished, UpdatedAt = dbo.fn_NepalNow(), UpdatedBy = @UpdatedBy
    WHERE Id = @Id AND IsDeleted = 0;
END
GO

