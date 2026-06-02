SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Payment_Create
    @OrderId         INT,
    @PaymentMethodId TINYINT,
    @PaymentType     TINYINT,        -- 1=Full 2=Advance 3=Balance
    @Amount          DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    INSERT INTO Payments (OrderId, PaymentMethodId, PaymentType, Amount, Status)
    VALUES (@OrderId, @PaymentMethodId, @PaymentType, @Amount, 1); -- Status=Pending

    SELECT SCOPE_IDENTITY() AS Id;
END
