CREATE OR ALTER PROCEDURE sp_ReceiptTemplate_GetDefault
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1
           Id, Name, HtmlContent, IsDefault, IsActive, CreatedAt, UpdatedAt, PublishedAt, PublishedByUserId
    FROM   ReceiptTemplates
    WHERE  IsDefault = 1 AND IsActive = 1
    ORDER  BY Id;
END
