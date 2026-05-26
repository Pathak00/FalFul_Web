USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_MenuItem_Update
    @Id           INT,
    @ParentId     INT           = NULL,
    @Label        NVARCHAR(100),
    @Url          NVARCHAR(500) = NULL,
    @Icon         NVARCHAR(50)  = NULL,
    @DisplayOrder INT           = 0,
    @IsVisible    BIT           = 1,
    @VisibleTo    TINYINT       = 0,
    @OpenInNewTab BIT           = 0,
    @UpdatedBy    INT           = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE MenuItems
    SET ParentId = @ParentId, Label = @Label, Url = @Url, Icon = @Icon,
        DisplayOrder = @DisplayOrder, IsVisible = @IsVisible, VisibleTo = @VisibleTo,
        OpenInNewTab = @OpenInNewTab, UpdatedAt = GETUTCDATE(), UpdatedBy = @UpdatedBy
    WHERE Id = @Id AND IsDeleted = 0;
END
GO
