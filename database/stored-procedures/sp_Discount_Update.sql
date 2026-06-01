SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Discount_Update
    @Id             INT,
    @Code           NVARCHAR(50),
    @Description    NVARCHAR(200) = NULL,
    @DiscountType   TINYINT,
    @Value          DECIMAL(10,2),
    @MinOrderAmount DECIMAL(10,2) = 0,
    @MaxUses        INT           = NULL,
    @StartDate      DATE          = NULL,
    @EndDate        DATE          = NULL,
    @IsActive       BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Discounts
    SET    Code           = UPPER(@Code),
           Description    = @Description,
           DiscountType   = @DiscountType,
           Value          = @Value,
           MinOrderAmount = @MinOrderAmount,
           MaxUses        = @MaxUses,
           StartDate      = @StartDate,
           EndDate        = @EndDate,
           IsActive       = @IsActive
    WHERE  Id = @Id;
END
