CREATE OR ALTER PROCEDURE sp_ReceiptPrintLog_Create
    @OrderId            INT,
    @PrintedByUserId    INT,
    @PrintedByRole      NVARCHAR(50),
    @TemplateId         INT = NULL,
    @TemplateVersionId  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ReceiptPrintLogs (OrderId, PrintedByUserId, PrintedByRole, PrintedAt, TemplateId, TemplateVersionId)
    VALUES (@OrderId, @PrintedByUserId, @PrintedByRole, dbo.fn_NepalNow(), @TemplateId, @TemplateVersionId);
    SELECT SCOPE_IDENTITY() AS Id;
END
