SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Role_GetDefault
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 Id, Name, NormalizedName, Description, IsDefault
    FROM   Roles
    WHERE  IsDefault = 1
    ORDER  BY Id;
END
