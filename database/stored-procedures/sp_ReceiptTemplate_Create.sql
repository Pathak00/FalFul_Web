CREATE OR ALTER PROCEDURE sp_ReceiptTemplate_Create
    @Name            NVARCHAR(100),
    @HtmlContent     NVARCHAR(MAX),
    @IsDefault       BIT = 0,
    @PublishedByUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- If this is being set as default, clear other defaults first
    IF @IsDefault = 1
        UPDATE ReceiptTemplates SET IsDefault = 0;

    INSERT INTO ReceiptTemplates (Name, HtmlContent, IsDefault, IsActive, CreatedAt, PublishedAt, PublishedByUserId)
    VALUES (@Name, @HtmlContent, @IsDefault, 1,
            dbo.fn_NepalNow(),
            CASE WHEN @PublishedByUserId IS NOT NULL THEN dbo.fn_NepalNow() ELSE NULL END,
            @PublishedByUserId);

    SELECT SCOPE_IDENTITY() AS Id;
END
