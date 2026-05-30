SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Payment_GetAll
    @PaymentMethodId TINYINT  = NULL,
    @Status          TINYINT  = NULL,
    @PaymentType     TINYINT  = NULL,
    @FromDate        DATE     = NULL,
    @ToDate          DATE     = NULL,
    @OrderId         INT      = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.Id, p.OrderId, o.OrderNumber,
           u.FullName AS CustomerName,
           p.PaymentMethodId, pm.Name AS PaymentMethodName, pm.Code AS PaymentMethodCode,
           p.PaymentType, p.Amount, p.Status,
           p.GatewayTransactionId, p.PaidAt, p.CreatedAt
    FROM   Payments p
    INNER  JOIN Orders         o  ON o.Id  = p.OrderId
    INNER  JOIN Users          u  ON u.Id  = o.UserId
    INNER  JOIN PaymentMethods pm ON pm.Id = p.PaymentMethodId
    WHERE  (@PaymentMethodId IS NULL OR p.PaymentMethodId = @PaymentMethodId)
      AND  (@Status          IS NULL OR p.Status          = @Status)
      AND  (@PaymentType     IS NULL OR p.PaymentType     = @PaymentType)
      AND  (@OrderId         IS NULL OR p.OrderId         = @OrderId)
      AND  (@FromDate        IS NULL OR CAST(p.CreatedAt AS DATE) >= @FromDate)
      AND  (@ToDate          IS NULL OR CAST(p.CreatedAt AS DATE) <= @ToDate)
    ORDER  BY p.Id DESC;
END
