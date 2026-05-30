SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Role_Create
    @Name        NVARCHAR(50),
    @Description NVARCHAR(200) = NULL,
    @PortalType  NVARCHAR(20)  = 'admin'
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DECLARE @NormalizedName NVARCHAR(50) = UPPER(@Name);

    IF EXISTS (SELECT 1 FROM Roles WHERE NormalizedName = @NormalizedName)
    BEGIN
        RAISERROR('A role with this name already exists.', 16, 1);
        RETURN;
    END

    INSERT INTO Roles (Name, NormalizedName, Description, PortalType)
    VALUES (@Name, @NormalizedName, @Description, @PortalType);

    SELECT SCOPE_IDENTITY() AS Id;
END
