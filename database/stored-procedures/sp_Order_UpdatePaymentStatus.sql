SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Order_UpdatePaymentStatus
    @Id            INT,
    @PaymentStatus TINYINT,
    @AdvanceAmount DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE Orders
    SET PaymentStatus = @PaymentStatus,
        AdvanceAmount = COALESCE(@AdvanceAmount, AdvanceAmount),
        UpdatedAt     = dbo.fn_NepalNow()
    WHERE Id = @Id;
END
