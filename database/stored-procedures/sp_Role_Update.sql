SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Role_Update
    @Id          INT,
    @Name        NVARCHAR(50),
    @Description NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DECLARE @NormalizedName NVARCHAR(50) = UPPER(@Name);

    IF EXISTS (SELECT 1 FROM Roles WHERE NormalizedName = @NormalizedName AND Id <> @Id)
    BEGIN
        RAISERROR('A role with this name already exists.', 16, 1);
        RETURN;
    END

    UPDATE Roles
    SET    Name           = @Name,
           NormalizedName = @NormalizedName,
           Description    = @Description
    WHERE  Id = @Id;
END
