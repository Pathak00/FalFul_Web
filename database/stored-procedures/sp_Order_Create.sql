SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Order_Create
    @UserId            INT,
    @SubTotal          DECIMAL(10,2),
    @DeliveryFee       DECIMAL(10,2),
    @ServiceFee        DECIMAL(10,2),
    @DiscountAmount    DECIMAL(10,2) = 0,
    @TotalAmount       DECIMAL(10,2),
    @DiscountCode      NVARCHAR(50)  = NULL,
    @PaymentMethod     TINYINT,
    @DeliveryAddressId INT           = NULL,
    @FullAddress       NVARCHAR(300),
    @City              NVARCHAR(100),
    @DeliveryPhone     NVARCHAR(20),
    @AddressLabel      NVARCHAR(50)  = NULL,
    @Landmark          NVARCHAR(200) = NULL,
    @DeliveryDate      DATE,
    @DeliveryTimeSlot  NVARCHAR(30),
    @Notes             NVARCHAR(500) = NULL,
    @DeliveryLatitude  FLOAT         = NULL,
    @DeliveryLongitude FLOAT         = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    DECLARE @NewId       INT;
    DECLARE @OrderNumber NVARCHAR(20);

    INSERT INTO Orders (UserId, OrderNumber, Status, SubTotal, DeliveryFee, ServiceFee,
                        DiscountCode, DiscountAmount, TotalAmount, PaymentMethod, PaymentStatus,
                        DeliveryAddressId, FullAddress, City, DeliveryPhone, AddressLabel, Landmark,
                        DeliveryDate, DeliveryTimeSlot, Notes,
                        DeliveryLatitude, DeliveryLongitude)
    VALUES (@UserId, 'TEMP', 1, @SubTotal, @DeliveryFee, @ServiceFee,
            @DiscountCode, @DiscountAmount, @TotalAmount, @PaymentMethod, 1,
            @DeliveryAddressId, @FullAddress, @City, @DeliveryPhone, @AddressLabel, @Landmark,
            @DeliveryDate, @DeliveryTimeSlot, @Notes,
            @DeliveryLatitude, @DeliveryLongitude);

    SET @NewId = SCOPE_IDENTITY();
    SET @OrderNumber = 'FF-' + CAST(YEAR(dbo.fn_NepalNow()) AS NVARCHAR) + '-' + RIGHT('000000' + CAST(@NewId AS NVARCHAR), 6);

    UPDATE Orders SET OrderNumber = @OrderNumber WHERE Id = @NewId;

    SELECT @NewId AS Id, @OrderNumber AS OrderNumber;
END
