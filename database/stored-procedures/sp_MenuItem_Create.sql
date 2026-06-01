USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_MenuItem_Create
    @ParentId          INT           = NULL,
    @Label             NVARCHAR(100),
    @Url               NVARCHAR(500) = NULL,
    @Icon              NVARCHAR(50)  = NULL,
    @DisplayOrder      INT           = 0,
    @IsVisible         BIT           = 1,
    @VisibleTo         TINYINT       = 0,
    @OpenInNewTab      BIT           = 0,
    @CreatedBy         INT           = NULL,
    @RequiredPortalType NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO MenuItems (ParentId, Label, Url, Icon, DisplayOrder, IsVisible, VisibleTo, OpenInNewTab, CreatedBy, RequiredPortalType)
    VALUES (@ParentId, @Label, @Url, @Icon, @DisplayOrder, @IsVisible, @VisibleTo, @OpenInNewTab, @CreatedBy, @RequiredPortalType);
    SELECT SCOPE_IDENTITY();
END
GO
