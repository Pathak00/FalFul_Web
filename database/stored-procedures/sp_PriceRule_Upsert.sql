SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_PriceRule_Upsert
    @RuleKey  NVARCHAR(60),
    @Value    DECIMAL(10,2),
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE PriceRules
    SET    Value = @Value, IsActive = @IsActive, UpdatedAt = dbo.fn_NepalNow()
    WHERE  RuleKey = @RuleKey;

    IF @@ROWCOUNT = 0
        INSERT INTO PriceRules (RuleKey, RuleName, Value, Unit, IsActive)
        VALUES (@RuleKey, @RuleKey, @Value, 'flat', @IsActive);
END

