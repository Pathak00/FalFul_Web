USE FalFulDb;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE sp_Organization_Register
    @Name             NVARCHAR(150),
    @OrganizationType NVARCHAR(50),
    @Description      NVARCHAR(500) = NULL,
    @ContactEmail     NVARCHAR(150),
    @ContactPhone     NVARCHAR(20),
    @Address          NVARCHAR(300) = NULL,
    @OwnerId          INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Organizations (Name, OrganizationType, Description, ContactEmail, ContactPhone, Address, OwnerId, CreatedAt)
    VALUES (@Name, @OrganizationType, @Description, @ContactEmail, @ContactPhone, @Address, @OwnerId, GETUTCDATE());

    SELECT SCOPE_IDENTITY();
END
GO

