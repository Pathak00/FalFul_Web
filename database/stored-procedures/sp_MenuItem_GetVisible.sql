USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_MenuItem_GetVisible
    @UserType TINYINT = NULL  -- NULL = not logged in
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ParentId, Label, Url, Icon, DisplayOrder, VisibleTo, OpenInNewTab
    FROM MenuItems
    WHERE IsDeleted = 0
      AND IsVisible = 1
      AND (
            VisibleTo = 0                                   -- Everyone
         OR (@UserType IS     NULL AND VisibleTo = 2)       -- Guest only
         OR (@UserType IS NOT NULL AND VisibleTo = 1)       -- Any logged-in
         OR (@UserType = 3    AND VisibleTo = 3)            -- Admin
         OR (@UserType = 2    AND VisibleTo = 4)            -- Organisation
         OR (@UserType = 1    AND VisibleTo = 5)            -- Individual
      )
    ORDER BY ISNULL(ParentId, Id), ParentId, DisplayOrder;
END
GO
