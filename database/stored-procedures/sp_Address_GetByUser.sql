CREATE OR ALTER PROCEDURE sp_Address_GetByUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, UserId, Label, FullAddress, City, Landmark, PhoneNumber, IsDefault, CreatedAt
    FROM   Addresses
    WHERE  UserId = @UserId
    ORDER  BY IsDefault DESC, Id DESC;
END
