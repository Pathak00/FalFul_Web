SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Deletes a non-system AdminNavItem.
-- Returns 0 if deleted, -1 if the item is a system item (cannot be deleted).
CREATE OR ALTER PROCEDURE sp_AdminNavItem_Delete
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM AdminNavItems WHERE Id = @Id AND IsSystem = 1)
    BEGIN
        SELECT -1 AS Result;
        RETURN;
    END

    DELETE FROM AdminNavItems WHERE Id = @Id;
    SELECT 0 AS Result;
END
GO
