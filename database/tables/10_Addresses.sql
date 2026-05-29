CREATE TABLE Addresses (
    Id          INT             IDENTITY(1,1) PRIMARY KEY,
    UserId      INT             NOT NULL REFERENCES Users(Id),
    Label       NVARCHAR(50)    NOT NULL DEFAULT 'Home',   -- Home, Office, Other
    FullAddress NVARCHAR(300)   NOT NULL,
    City        NVARCHAR(100)   NOT NULL,
    Landmark    NVARCHAR(200)   NULL,
    PhoneNumber NVARCHAR(20)    NOT NULL,
    IsDefault   BIT             NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);
