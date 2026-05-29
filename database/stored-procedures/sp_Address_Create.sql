SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Address_Create
    @UserId      INT,
    @Label       NVARCHAR(50),
    @FullAddress NVARCHAR(300),
    @City        NVARCHAR(100),
    @Landmark    NVARCHAR(200) = NULL,
    @PhoneNumber NVARCHAR(20),
    @IsDefault   BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    IF @IsDefault = 1
        UPDATE Addresses SET IsDefault = 0 WHERE UserId = @UserId;

    INSERT INTO Addresses (UserId, Label, FullAddress, City, Landmark, PhoneNumber, IsDefault)
    VALUES (@UserId, @Label, @FullAddress, @City, @Landmark, @PhoneNumber, @IsDefault);

    SELECT SCOPE_IDENTITY() AS Id;
END
