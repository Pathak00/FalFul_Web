CREATE OR ALTER PROCEDURE sp_PriceRule_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, RuleKey, RuleName, Value, Unit, IsActive, UpdatedAt
    FROM   PriceRules
    ORDER  BY Id;
END
