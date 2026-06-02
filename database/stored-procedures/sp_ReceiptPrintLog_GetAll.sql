CREATE OR ALTER PROCEDURE sp_ReceiptPrintLog_GetAll
    @OrderId    INT = NULL,
    @PageSize   INT = 50,
    @PageOffset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  l.Id, l.OrderId, o.OrderNumber,
            l.PrintedByUserId, u.FullName AS PrintedByName,
            l.PrintedByRole, l.PrintedAt,
            l.TemplateId, t.Name AS TemplateName,
            l.TemplateVersionId
    FROM    ReceiptPrintLogs l
    INNER   JOIN Orders o ON o.Id = l.OrderId
    INNER   JOIN Users  u ON u.Id = l.PrintedByUserId
    LEFT    JOIN ReceiptTemplates t ON t.Id = l.TemplateId
    WHERE  (@OrderId IS NULL OR l.OrderId = @OrderId)
    ORDER   BY l.PrintedAt DESC
    OFFSET  @PageOffset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
