SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Product_SetAvailability
    @Id          INT,
    @IsAvailable BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;
    UPDATE Products SET IsAvailable = @IsAvailable, UpdatedAt = GETUTCDATE() WHERE Id = @Id AND IsDeleted = 0;
END
