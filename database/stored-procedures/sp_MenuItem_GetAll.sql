USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_MenuItem_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ParentId, Label, Url, Icon, DisplayOrder, IsVisible, VisibleTo, OpenInNewTab
    FROM MenuItems
    WHERE IsDeleted = 0
    ORDER BY ISNULL(ParentId, Id), ParentId, DisplayOrder;
END
GO
