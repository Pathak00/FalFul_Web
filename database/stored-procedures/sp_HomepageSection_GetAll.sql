USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_HomepageSection_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, SectionKey, Title, Subtitle, Content, IsVisible, DisplayOrder, UpdatedAt
    FROM HomepageSections
    ORDER BY DisplayOrder ASC;
END
GO
