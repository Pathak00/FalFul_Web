USE FalFulDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pages' AND xtype='U')
BEGIN
    CREATE TABLE Pages (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        Title           NVARCHAR(200)   NOT NULL,
        Slug            NVARCHAR(200)   NOT NULL,
        Content         NVARCHAR(MAX)   NULL,
        MetaTitle       NVARCHAR(200)   NULL,
        MetaDescription NVARCHAR(500)   NULL,
        IsPublished     BIT             NOT NULL DEFAULT 0,
        IsDeleted       BIT             NOT NULL DEFAULT 0,
        CreatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt       DATETIME2       NULL,
        CreatedBy       INT             NULL,
        UpdatedBy       INT             NULL,
        CONSTRAINT UQ_Pages_Slug UNIQUE (Slug)
    );

    CREATE INDEX IX_Pages_Slug        ON Pages(Slug)        WHERE IsDeleted = 0;
    CREATE INDEX IX_Pages_IsPublished ON Pages(IsPublished) WHERE IsDeleted = 0;

    PRINT 'Pages table created.';
END
ELSE
    PRINT 'Pages table already exists.';
GO
