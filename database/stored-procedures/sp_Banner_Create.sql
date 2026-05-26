USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Banner_Create
    @Title        NVARCHAR(200),
    @Subtitle     NVARCHAR(500) = NULL,
    @ButtonText   NVARCHAR(100) = NULL,
    @ButtonLink   NVARCHAR(500) = NULL,
    @ImageUrl     NVARCHAR(1000) = NULL,
    @Position     NVARCHAR(50) = 'home',
    @IsActive     BIT = 1,
    @DisplayOrder INT = 0,
    @StartDate    DATETIME2 = NULL,
    @EndDate      DATETIME2 = NULL,
    @CreatedBy    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Banners (Title, Subtitle, ButtonText, ButtonLink, ImageUrl, Position, IsActive, DisplayOrder, StartDate, EndDate, CreatedBy)
    VALUES (@Title, @Subtitle, @ButtonText, @ButtonLink, @ImageUrl, @Position, @IsActive, @DisplayOrder, @StartDate, @EndDate, @CreatedBy);
    SELECT SCOPE_IDENTITY();
END
GO
