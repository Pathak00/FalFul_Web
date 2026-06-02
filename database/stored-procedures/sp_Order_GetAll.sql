CREATE OR ALTER PROCEDURE sp_Order_GetAll
    @Status   TINYINT = NULL,
    @UserId   INT     = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT o.Id, o.UserId, o.OrderNumber, o.Status, o.SubTotal, o.DeliveryFee, o.ServiceFee,
           o.TotalAmount, o.AdvanceAmount, o.PaymentMethod, o.PaymentStatus, o.DeliveryAddressId,
           o.DeliveryDate, o.DeliveryTimeSlot, o.Notes, o.CancelReason, o.CreatedAt, o.UpdatedAt,
           COALESCE(a.FullAddress, o.FullAddress)   AS FullAddress,
           COALESCE(a.City,        o.City)           AS City,
           COALESCE(a.PhoneNumber, o.DeliveryPhone)  AS DeliveryPhone,
           u.FullName AS CustomerName,
           (SELECT COUNT(*) FROM OrderItems oi WHERE oi.OrderId = o.Id) AS ItemCount,
           d.Status AS DeliveryStatus
    FROM   Orders o
    LEFT   JOIN Addresses a  ON a.Id      = o.DeliveryAddressId
    INNER  JOIN Users u      ON u.Id      = o.UserId
    LEFT   JOIN Deliveries d ON d.OrderId = o.Id
    WHERE  (@Status IS NULL OR o.Status = @Status)
      AND  (@UserId IS NULL OR o.UserId = @UserId)
    ORDER  BY o.CreatedAt DESC;
END
