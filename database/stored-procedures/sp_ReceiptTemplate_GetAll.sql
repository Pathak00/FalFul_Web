CREATE OR ALTER PROCEDURE sp_ReceiptTemplate_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, IsDefault, IsActive, CreatedAt, UpdatedAt, PublishedAt, PublishedByUserId
    FROM   ReceiptTemplates
    ORDER  BY IsDefault DESC, Name;
END
