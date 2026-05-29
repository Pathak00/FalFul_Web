SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_OrderRating_Create
    @OrderId              INT,
    @UserId               INT,
    @DeliveryRating       TINYINT        = NULL,
    @ProductQualityRating TINYINT        = NULL,
    @OverallRating        TINYINT,
    @Comment              NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    IF EXISTS (SELECT 1 FROM OrderRatings WHERE OrderId = @OrderId AND UserId = @UserId)
        UPDATE OrderRatings
        SET    DeliveryRating       = @DeliveryRating,
               ProductQualityRating = @ProductQualityRating,
               OverallRating        = @OverallRating,
               Comment              = @Comment
        WHERE  OrderId = @OrderId AND UserId = @UserId;
    ELSE
        INSERT INTO OrderRatings (OrderId, UserId, DeliveryRating, ProductQualityRating, OverallRating, Comment)
        VALUES (@OrderId, @UserId, @DeliveryRating, @ProductQualityRating, @OverallRating, @Comment);
END
