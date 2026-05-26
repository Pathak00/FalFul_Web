USE FalFulDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Organizations' AND xtype='U')
BEGIN
    CREATE TABLE Organizations (
        Id               INT IDENTITY(1,1) PRIMARY KEY,
        Name             NVARCHAR(150)  NOT NULL,
        Description      NVARCHAR(500)  NULL,
        OrganizationType NVARCHAR(50)   NOT NULL,
        ContactEmail     NVARCHAR(150)  NOT NULL,
        ContactPhone     NVARCHAR(20)   NOT NULL,
        Address          NVARCHAR(300)  NULL,
        LogoUrl          NVARCHAR(500)  NULL,
        IsVerified       BIT            NOT NULL DEFAULT 0,
        IsActive         BIT            NOT NULL DEFAULT 1,
        OwnerId          INT            NOT NULL,
        IsDeleted        BIT            NOT NULL DEFAULT 0,
        CreatedAt        DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt        DATETIME2      NULL,
        CreatedBy        INT            NULL,
        UpdatedBy        INT            NULL,
        CONSTRAINT UQ_Organizations_Name    UNIQUE (Name),
        CONSTRAINT FK_Organizations_Owner   FOREIGN KEY (OwnerId) REFERENCES Users(Id)
    );

    CREATE INDEX IX_Organizations_OwnerId ON Organizations(OwnerId) WHERE IsDeleted = 0;
    CREATE INDEX IX_Organizations_Name    ON Organizations(Name)    WHERE IsDeleted = 0;

    PRINT 'Organizations table created.';
END
ELSE
    PRINT 'Organizations table already exists.';
GO
