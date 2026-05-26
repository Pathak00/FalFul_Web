USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_HomepageSection_GetVisible
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, SectionKey, Title, Subtitle, Content, DisplayOrder
    FROM HomepageSections
    WHERE IsVisible = 1
    ORDER BY DisplayOrder ASC;
END
GO
