CREATE OR ALTER PROCEDURE sp_ReceiptTemplateVersion_GetAll
    @TemplateId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TemplateId, VersionNumber, Label, CreatedAt, CreatedByUserId
    FROM   ReceiptTemplateVersions
    WHERE  TemplateId = @TemplateId
    ORDER  BY VersionNumber DESC;
END
