USE FalFulDb;
GO

CREATE OR ALTER PROCEDURE sp_Organization_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Name, Description, OrganizationType, ContactEmail, ContactPhone,
           Address, LogoUrl, IsVerified, IsActive, OwnerId, IsDeleted, CreatedAt, UpdatedAt
    FROM Organizations
    WHERE Id = @Id AND IsDeleted = 0;
END
GO
