USE FalFulDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        FullName        NVARCHAR(100)   NOT NULL,
        Email           NVARCHAR(150)   NULL,
        PhoneNumber     NVARCHAR(20)    NULL,
        PasswordHash    NVARCHAR(256)   NULL,
        UserType        TINYINT         NOT NULL DEFAULT 1,  -- 1=Individual, 2=Organization, 3=Admin
        IsActive        BIT             NOT NULL DEFAULT 1,
        IsEmailVerified BIT             NOT NULL DEFAULT 0,
        IsPhoneVerified BIT             NOT NULL DEFAULT 0,
        ProfileImageUrl NVARCHAR(500)   NULL,
        GoogleId        NVARCHAR(100)   NULL,
        LastLoginAt     DATETIME2       NULL,
        IsDeleted       BIT             NOT NULL DEFAULT 0,
        CreatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt       DATETIME2       NULL,
        CreatedBy       INT             NULL,
        UpdatedBy       INT             NULL,
    );

    -- Filtered unique indexes allow multiple NULLs (needed for Google/phone/email-only accounts)
    CREATE UNIQUE INDEX UX_Users_Email     ON Users(Email)       WHERE Email       IS NOT NULL AND IsDeleted = 0;
    CREATE UNIQUE INDEX UX_Users_Phone     ON Users(PhoneNumber) WHERE PhoneNumber IS NOT NULL AND IsDeleted = 0;
    CREATE UNIQUE INDEX UX_Users_GoogleId  ON Users(GoogleId)    WHERE GoogleId    IS NOT NULL AND IsDeleted = 0;
    CREATE INDEX IX_Users_UserType         ON Users(UserType)    WHERE IsDeleted = 0;

    PRINT 'Users table created.';
END
ELSE
    PRINT 'Users table already exists.';
GO
