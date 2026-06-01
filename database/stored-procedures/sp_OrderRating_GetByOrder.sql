CREATE OR ALTER PROCEDURE sp_OrderRating_GetByOrder
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, OrderId, UserId, DeliveryRating, ProductQualityRating, OverallRating,
           Comment, ReceiptAcknowledged, ReceiptAcknowledgedAt, CreatedAt
    FROM   OrderRatings
    WHERE  OrderId = @OrderId;
END
