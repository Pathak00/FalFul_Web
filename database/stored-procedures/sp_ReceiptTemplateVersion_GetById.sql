CREATE OR ALTER PROCEDURE sp_ReceiptTemplateVersion_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TemplateId, VersionNumber, HtmlContent, Label, CreatedAt, CreatedByUserId
    FROM   ReceiptTemplateVersions
    WHERE  Id = @Id;
END
