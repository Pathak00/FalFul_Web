SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Payment_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.Id, p.OrderId, p.PaymentMethodId,
           pm.Name AS PaymentMethodName, pm.Code AS PaymentMethodCode,
           p.PaymentType, p.Amount, p.Status,
           p.GatewayTransactionId, p.PaidAt, p.CreatedAt, p.UpdatedAt,
           o.OrderNumber, u.FullName AS CustomerName
    FROM   Payments p
    INNER  JOIN PaymentMethods pm ON pm.Id = p.PaymentMethodId
    INNER  JOIN Orders         o  ON o.Id  = p.OrderId
    INNER  JOIN Users          u  ON u.Id  = o.UserId
    WHERE  p.Id = @Id;
END
