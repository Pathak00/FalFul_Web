USE FalFulDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RefreshTokens' AND xtype='U')
BEGIN
    CREATE TABLE RefreshTokens (
        Id         INT IDENTITY(1,1) PRIMARY KEY,
        UserId     INT           NOT NULL,
        Token      NVARCHAR(256) NOT NULL,
        ExpiresAt  DATETIME2     NOT NULL,
        IsRevoked  BIT           NOT NULL DEFAULT 0,
        DeviceInfo NVARCHAR(200) NULL,
        IpAddress  NVARCHAR(50)  NULL,
        IsDeleted  BIT           NOT NULL DEFAULT 0,
        CreatedAt  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt  DATETIME2     NULL,
        CreatedBy  INT           NULL,
        UpdatedBy  INT           NULL,
        CONSTRAINT UQ_RefreshTokens_Token UNIQUE (Token),
        CONSTRAINT FK_RefreshTokens_User  FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    CREATE INDEX IX_RefreshTokens_Token  ON RefreshTokens(Token)  WHERE IsRevoked = 0;
    CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId) WHERE IsRevoked = 0;

    PRINT 'RefreshTokens table created.';
END
ELSE
    PRINT 'RefreshTokens table already exists.';
GO
