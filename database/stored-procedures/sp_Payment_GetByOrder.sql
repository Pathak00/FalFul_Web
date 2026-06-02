SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Payment_GetByOrder
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.Id, p.OrderId, p.PaymentMethodId, pm.Name AS PaymentMethodName, pm.Code AS PaymentMethodCode,
           p.PaymentType, p.Amount, p.Status,
           p.GatewayTransactionId, p.PaidAt, p.CreatedAt, p.UpdatedAt
    FROM   Payments p
    INNER  JOIN PaymentMethods pm ON pm.Id = p.PaymentMethodId
    WHERE  p.OrderId = @OrderId
    ORDER  BY p.Id;
END
