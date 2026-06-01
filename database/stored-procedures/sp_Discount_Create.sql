SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Discount_Create
    @Code           NVARCHAR(50),
    @Description    NVARCHAR(200) = NULL,
    @DiscountType   TINYINT,
    @Value          DECIMAL(10,2),
    @MinOrderAmount DECIMAL(10,2) = 0,
    @MaxUses        INT           = NULL,
    @StartDate      DATE          = NULL,
    @EndDate        DATE          = NULL,
    @IsActive       BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Discounts (Code, Description, DiscountType, Value, MinOrderAmount, MaxUses, StartDate, EndDate, IsActive)
    VALUES (UPPER(@Code), @Description, @DiscountType, @Value, @MinOrderAmount, @MaxUses, @StartDate, @EndDate, @IsActive);
    SELECT SCOPE_IDENTITY() AS Id;
END
