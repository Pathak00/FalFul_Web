CREATE OR ALTER PROCEDURE sp_Order_GetByUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT o.Id, o.UserId, o.OrderNumber, o.Status, o.SubTotal, o.DeliveryFee, o.ServiceFee,
           o.TotalAmount, o.PaymentMethod, o.PaymentStatus, o.DeliveryAddressId,
           o.DeliveryDate, o.DeliveryTimeSlot, o.Notes, o.CancelReason, o.CreatedAt, o.UpdatedAt,
           a.FullAddress, a.City, a.PhoneNumber AS DeliveryPhone
    FROM   Orders o
    INNER  JOIN Addresses a ON a.Id = o.DeliveryAddressId
    WHERE  o.UserId = @UserId
    ORDER  BY o.CreatedAt DESC;
END
