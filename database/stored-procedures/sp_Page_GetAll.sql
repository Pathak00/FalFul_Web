USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Page_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Title, Slug, MetaTitle, MetaDescription, IsPublished, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
    FROM Pages
    WHERE IsDeleted = 0
    ORDER BY CreatedAt DESC;
END
GO
