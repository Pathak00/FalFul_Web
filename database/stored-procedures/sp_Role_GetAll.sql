SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Role_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, NormalizedName, Description, IsDefault, PortalType FROM Roles ORDER BY Id;
END
