USE FalFulDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Banners' AND xtype='U')
BEGIN
    CREATE TABLE Banners (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Title        NVARCHAR(200)   NOT NULL,
        Subtitle     NVARCHAR(500)   NULL,
        ButtonText   NVARCHAR(100)   NULL,
        ButtonLink   NVARCHAR(500)   NULL,
        ImageUrl     NVARCHAR(1000)  NULL,
        Position     NVARCHAR(50)    NOT NULL DEFAULT 'home',  -- home, promo, sidebar
        IsActive     BIT             NOT NULL DEFAULT 1,
        DisplayOrder INT             NOT NULL DEFAULT 0,
        StartDate    DATETIME2       NULL,
        EndDate      DATETIME2       NULL,
        IsDeleted    BIT             NOT NULL DEFAULT 0,
        CreatedAt    DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt    DATETIME2       NULL,
        CreatedBy    INT             NULL,
        UpdatedBy    INT             NULL
    );

    CREATE INDEX IX_Banners_Active ON Banners(IsActive, Position) WHERE IsDeleted = 0;

    PRINT 'Banners table created.';
END
ELSE
    PRINT 'Banners table already exists.';
GO
