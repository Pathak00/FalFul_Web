USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Banner_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Title, Subtitle, ButtonText, ButtonLink, ImageUrl, Position, IsActive, DisplayOrder, StartDate, EndDate, CreatedAt, UpdatedAt
    FROM Banners
    WHERE IsDeleted = 0
    ORDER BY DisplayOrder ASC, CreatedAt DESC;
END
GO
