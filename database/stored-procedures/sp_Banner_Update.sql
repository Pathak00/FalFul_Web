USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Banner_Update
    @Id           INT,
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
    @UpdatedBy    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Banners
    SET Title = @Title, Subtitle = @Subtitle, ButtonText = @ButtonText,
        ButtonLink = @ButtonLink, ImageUrl = @ImageUrl, Position = @Position,
        IsActive = @IsActive, DisplayOrder = @DisplayOrder,
        StartDate = @StartDate, EndDate = @EndDate,
        UpdatedAt = GETUTCDATE(), UpdatedBy = @UpdatedBy
    WHERE Id = @Id AND IsDeleted = 0;
END
GO
