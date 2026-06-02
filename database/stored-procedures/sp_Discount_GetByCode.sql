SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Discount_GetByCode
    @Code NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Code, Description, DiscountType, Value, MinOrderAmount,
           MaxUses, UsesCount, StartDate, EndDate, IsActive, CreatedAt
    FROM   Discounts
    WHERE  Code = UPPER(@Code);
END
