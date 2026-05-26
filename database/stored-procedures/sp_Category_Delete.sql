SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Category_Delete
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    IF EXISTS (SELECT 1 FROM Products WHERE CategoryId = @Id AND IsDeleted = 0)
    BEGIN
        RAISERROR('Cannot delete category: it has active products.', 16, 1);
        RETURN;
    END

    DELETE FROM Categories WHERE Id = @Id;
END
