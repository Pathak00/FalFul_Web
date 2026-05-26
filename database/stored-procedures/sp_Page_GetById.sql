USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Page_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Title, Slug, Content, MetaTitle, MetaDescription, IsPublished, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
    FROM Pages
    WHERE Id = @Id AND IsDeleted = 0;
END
GO
