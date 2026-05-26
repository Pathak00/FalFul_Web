USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Page_Create
    @Title           NVARCHAR(200),
    @Slug            NVARCHAR(200),
    @Content         NVARCHAR(MAX) = NULL,
    @MetaTitle       NVARCHAR(200) = NULL,
    @MetaDescription NVARCHAR(500) = NULL,
    @IsPublished     BIT = 0,
    @CreatedBy       INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Pages WHERE Slug = @Slug AND IsDeleted = 0)
    BEGIN
        RAISERROR('A page with this slug already exists.', 16, 1);
        RETURN;
    END

    INSERT INTO Pages (Title, Slug, Content, MetaTitle, MetaDescription, IsPublished, CreatedBy)
    VALUES (@Title, @Slug, @Content, @MetaTitle, @MetaDescription, @IsPublished, @CreatedBy);

    SELECT SCOPE_IDENTITY();
END
GO
