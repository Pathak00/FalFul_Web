USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_HomepageSection_Upsert
    @SectionKey  NVARCHAR(100),
    @Title       NVARCHAR(200)  = NULL,
    @Subtitle    NVARCHAR(500)  = NULL,
    @Content     NVARCHAR(MAX)  = NULL,
    @IsVisible   BIT = 1,
    @DisplayOrder INT = 0,
    @UpdatedBy   INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM HomepageSections WHERE SectionKey = @SectionKey)
    BEGIN
        UPDATE HomepageSections
        SET Title = @Title, Subtitle = @Subtitle, Content = @Content,
            IsVisible = @IsVisible, DisplayOrder = @DisplayOrder,
            UpdatedAt = dbo.fn_NepalNow(), UpdatedBy = @UpdatedBy
        WHERE SectionKey = @SectionKey;

        SELECT Id FROM HomepageSections WHERE SectionKey = @SectionKey;
    END
    ELSE
    BEGIN
        INSERT INTO HomepageSections (SectionKey, Title, Subtitle, Content, IsVisible, DisplayOrder, UpdatedBy)
        VALUES (@SectionKey, @Title, @Subtitle, @Content, @IsVisible, @DisplayOrder, @UpdatedBy);
        SELECT SCOPE_IDENTITY();
    END
END
GO

