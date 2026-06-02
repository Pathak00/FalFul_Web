CREATE OR ALTER PROCEDURE sp_ReceiptTemplate_Update
    @Id              INT,
    @Name            NVARCHAR(100),
    @HtmlContent     NVARCHAR(MAX),
    @IsDefault       BIT,
    @IsActive        BIT,
    @PublishedByUserId INT = NULL,
    @SaveVersion     BIT = 1,          -- snapshot current content before overwriting
    @VersionLabel    NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Snapshot current content as a new version before overwriting
    IF @SaveVersion = 1
    BEGIN
        DECLARE @NextVersion INT;
        SELECT @NextVersion = ISNULL(MAX(VersionNumber), 0) + 1
        FROM   ReceiptTemplateVersions
        WHERE  TemplateId = @Id;

        INSERT INTO ReceiptTemplateVersions (TemplateId, VersionNumber, HtmlContent, Label, CreatedAt, CreatedByUserId)
        SELECT @Id, @NextVersion, HtmlContent, @VersionLabel, dbo.fn_NepalNow(), @PublishedByUserId
        FROM   ReceiptTemplates
        WHERE  Id = @Id;
    END

    -- If setting as default, clear other defaults first
    IF @IsDefault = 1
        UPDATE ReceiptTemplates SET IsDefault = 0 WHERE Id <> @Id;

    UPDATE ReceiptTemplates
    SET    Name              = @Name,
           HtmlContent       = @HtmlContent,
           IsDefault         = @IsDefault,
           IsActive          = @IsActive,
           UpdatedAt         = dbo.fn_NepalNow(),
           PublishedAt       = CASE WHEN @PublishedByUserId IS NOT NULL THEN dbo.fn_NepalNow() ELSE PublishedAt END,
           PublishedByUserId = CASE WHEN @PublishedByUserId IS NOT NULL THEN @PublishedByUserId ELSE PublishedByUserId END
    WHERE  Id = @Id;
END
