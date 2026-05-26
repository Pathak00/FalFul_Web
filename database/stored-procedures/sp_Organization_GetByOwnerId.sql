USE FalFulDb;
GO

CREATE OR ALTER PROCEDURE sp_Organization_GetByOwnerId
    @OwnerId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Name, Description, OrganizationType, ContactEmail, ContactPhone,
           Address, LogoUrl, IsVerified, IsActive, OwnerId, IsDeleted, CreatedAt, UpdatedAt
    FROM Organizations
    WHERE OwnerId = @OwnerId AND IsDeleted = 0;
END
GO
