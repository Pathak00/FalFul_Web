SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Delivery_Complete
    @Id                INT,
    @CollectedAmount   DECIMAL(10,2),
    @ProofPhotoUrl     NVARCHAR(500) = NULL,
    @CollectionRemarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DECLARE @OldStatus TINYINT;
    SELECT @OldStatus = Status FROM Deliveries WHERE Id = @Id;

    IF @OldStatus IS NULL
    BEGIN
        RAISERROR('Delivery not found.', 16, 1);
        RETURN;
    END

    UPDATE Deliveries
    SET    Status             = 5,  -- Delivered
           CollectedAmount    = @CollectedAmount,
           ProofPhotoUrl      = @ProofPhotoUrl,
           CollectionRemarks  = @CollectionRemarks,
           DeliveredAt        = dbo.fn_NepalNow(),
           UpdatedAt          = dbo.fn_NepalNow()
    WHERE  Id = @Id;

    -- Decrement stock once, guarded against double-adjustment
    IF @OldStatus <> 5
    BEGIN
        UPDATE p
        SET    p.Stock = p.Stock - oi.Quantity
        FROM   Products   p
        JOIN   OrderItems oi ON oi.ProductId = p.Id
        JOIN   Deliveries d  ON d.OrderId    = oi.OrderId
        WHERE  d.Id = @Id
          AND  oi.ProductId IS NOT NULL;
    END
END
