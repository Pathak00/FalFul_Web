USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Banner_GetActive
    @Position NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now DATETIME2 = dbo.fn_NepalNow();

    SELECT Id, Title, Subtitle, ButtonText, ButtonLink, ImageUrl, Position, DisplayOrder
    FROM Banners
    WHERE IsDeleted = 0
      AND IsActive = 1
      AND (StartDate IS NULL OR StartDate <= @Now)
      AND (EndDate IS NULL OR EndDate >= @Now)
      AND (@Position IS NULL OR Position = @Position)
    ORDER BY DisplayOrder ASC;
END
GO

