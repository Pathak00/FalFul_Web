SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_AdminNavItem_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Label, Route, Icon, ParentId, GroupLabel, DisplayOrder, IsVisible, RequiredPermission, IsSystem
    FROM   AdminNavItems
    ORDER  BY DisplayOrder;
END
GO
