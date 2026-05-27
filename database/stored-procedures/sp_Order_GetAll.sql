CREATE OR ALTER PROCEDURE sp_Order_GetAll
    @Status   TINYINT = NULL,
    @UserId   INT     = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT o.Id, o.UserId, o.OrderNumber, o.Status, o.SubTotal, o.DeliveryFee, o.ServiceFee,
           o.TotalAmount, o.PaymentMethod, o.PaymentStatus, o.DeliveryAddressId,
           o.DeliveryDate, o.DeliveryTimeSlot, o.Notes, o.CancelReason, o.CreatedAt, o.UpdatedAt,
           a.FullAddress, a.City, a.PhoneNumber AS DeliveryPhone,
           u.FullName AS CustomerName
    FROM   Orders o
    INNER  JOIN Addresses a ON a.Id = o.DeliveryAddressId
    INNER  JOIN Users u     ON u.Id = o.UserId
    WHERE  (@Status IS NULL OR o.Status = @Status)
      AND  (@UserId IS NULL OR o.UserId = @UserId)
    ORDER  BY o.CreatedAt DESC;
END
