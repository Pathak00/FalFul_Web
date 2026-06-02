CREATE OR ALTER PROCEDURE sp_ReceiptTemplate_Delete
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Prevent deleting the last default template
    IF EXISTS (SELECT 1 FROM ReceiptTemplates WHERE Id = @Id AND IsDefault = 1)
    BEGIN
        RAISERROR('Cannot delete the default receipt template. Set another template as default first.', 16, 1);
        RETURN;
    END
    DELETE FROM ReceiptTemplates WHERE Id = @Id;
END
