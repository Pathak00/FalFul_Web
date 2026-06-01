-- Returns three result sets:
--   #1  Order header + delivery + customer data (single row)
--   #2  Order items (multiple rows)
--   #3  Payment records (multiple rows)
CREATE OR ALTER PROCEDURE sp_Order_GetReceiptData
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: Order + Delivery + Customer + Rating summary
    SELECT
        o.Id              AS OrderId,
        o.OrderNumber,
        o.Status          AS OrderStatus,
        o.SubTotal,
        o.DeliveryFee,
        o.ServiceFee,
        o.DiscountAmount,
        o.DiscountCode,
        o.TotalAmount,
        o.AdvanceAmount,
        o.PaymentMethod,
        o.PaymentStatus,
        o.DeliveryDate,
        o.DeliveryTimeSlot,
        o.Notes           AS CustomerNotes,
        o.CreatedAt       AS OrderDate,
        -- Delivery address (snapshot stored on order)
        o.FullAddress     AS DeliveryFullAddress,
        o.City            AS DeliveryCity,
        o.DeliveryPhone,
        o.AddressLabel,
        o.Landmark,
        -- Customer
        u.Id              AS CustomerId,
        u.FullName        AS CustomerName,
        u.Email           AS CustomerEmail,
        u.PhoneNumber     AS CustomerPhone,
        -- Delivery
        d.Id              AS DeliveryId,
        d.Status          AS DeliveryStatus,
        d.ScheduledDate,
        d.ScheduledTimeSlot,
        d.DeliveredAt,
        d.RiderName,
        d.RiderPhone,
        d.AttemptCount,
        d.CollectedAmount,
        d.ProofPhotoUrl,
        -- Rating acknowledgement
        r.ReceiptAcknowledged,
        r.ReceiptAcknowledgedAt
    FROM  Orders o
    INNER JOIN Users u ON u.Id = o.UserId
    LEFT  JOIN Deliveries d ON d.OrderId = o.Id
    LEFT  JOIN OrderRatings r ON r.OrderId = o.Id
    WHERE o.Id = @OrderId;

    -- Result set 2: Order items
    SELECT Id, OrderId, ProductId, ProductName, ProductSlug,
           UnitPrice, Quantity, Unit, TotalPrice,
           IsCustomBuild, CustomBuildDetails
    FROM   OrderItems
    WHERE  OrderId = @OrderId
    ORDER  BY Id;

    -- Result set 3: Payment records
    SELECT Id, OrderId, PaymentMethodId, PaymentType, Amount,
           Status AS PaymentStatus, GatewayTransactionId, PaidAt, CreatedAt
    FROM   Payments
    WHERE  OrderId = @OrderId
    ORDER  BY CreatedAt;
END
