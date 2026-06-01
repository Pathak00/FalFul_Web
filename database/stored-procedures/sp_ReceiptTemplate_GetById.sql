CREATE OR ALTER PROCEDURE sp_ReceiptTemplate_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, HtmlContent, IsDefault, IsActive, CreatedAt, UpdatedAt, PublishedAt, PublishedByUserId
    FROM   ReceiptTemplates
    WHERE  Id = @Id;
END
