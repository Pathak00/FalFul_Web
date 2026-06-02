SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Payment_UpdateStatus
    @Id                   INT,
    @Status               TINYINT,        -- 1=Pending 2=Completed 3=Failed 4=Refunded
    @GatewayTransactionId NVARCHAR(200) = NULL,
    @GatewayResponse      NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE Payments
    SET Status               = @Status,
        GatewayTransactionId = COALESCE(@GatewayTransactionId, GatewayTransactionId),
        GatewayResponse      = COALESCE(@GatewayResponse,      GatewayResponse),
        PaidAt               = CASE WHEN @Status = 2 THEN dbo.fn_NepalNow() ELSE PaidAt END,
        UpdatedAt            = dbo.fn_NepalNow()
    WHERE Id = @Id;
END
