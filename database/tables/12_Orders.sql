CREATE TABLE Orders (
    Id                INT             IDENTITY(1,1) PRIMARY KEY,
    UserId            INT             NOT NULL REFERENCES Users(Id),
    OrderNumber       NVARCHAR(20)    NOT NULL UNIQUE,
    -- Status: 1=Pending 2=Confirmed 3=Preparing 4=OutForDelivery 5=Delivered 6=Cancelled
    Status            TINYINT         NOT NULL DEFAULT 1,
    SubTotal          DECIMAL(10,2)   NOT NULL,
    DeliveryFee       DECIMAL(10,2)   NOT NULL DEFAULT 0,
    ServiceFee        DECIMAL(10,2)   NOT NULL DEFAULT 0,
    TotalAmount       DECIMAL(10,2)   NOT NULL,
    -- PaymentMethod: 1=CashOnDelivery 2=eSewa 3=Khalti
    PaymentMethod     TINYINT         NOT NULL DEFAULT 1,
    -- PaymentStatus: 1=Pending 2=Paid 3=Failed 4=Refunded
    PaymentStatus     TINYINT         NOT NULL DEFAULT 1,
    DeliveryAddressId INT             NOT NULL REFERENCES Addresses(Id),
    DeliveryDate      DATE            NOT NULL,
    DeliveryTimeSlot  NVARCHAR(30)    NOT NULL,
    Notes             NVARCHAR(500)   NULL,
    CancelReason      NVARCHAR(300)   NULL,
    CreatedAt         DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2       NULL
);

CREATE TABLE OrderItems (
    Id                  INT             IDENTITY(1,1) PRIMARY KEY,
    OrderId             INT             NOT NULL REFERENCES Orders(Id),
    ProductId           INT             NULL REFERENCES Products(Id),
    ProductName         NVARCHAR(200)   NOT NULL,
    ProductSlug         NVARCHAR(220)   NULL,
    ImageUrl            NVARCHAR(500)   NULL,
    UnitPrice           DECIMAL(10,2)   NOT NULL,
    Quantity            DECIMAL(10,2)   NOT NULL,
    Unit                NVARCHAR(20)    NOT NULL DEFAULT 'KG',
    TotalPrice          DECIMAL(10,2)   NOT NULL,
    IsCustomBuild       BIT             NOT NULL DEFAULT 0,
    CustomBuildDetails  NVARCHAR(MAX)   NULL      -- JSON for custom fruit combos
);
