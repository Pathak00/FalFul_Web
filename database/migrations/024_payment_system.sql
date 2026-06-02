-- Migration 024: Payment System
-- Creates PaymentMethods and Payments tables, adds AdvanceAmount to Orders,
-- and seeds payment configuration into AppSettings.

BEGIN TRANSACTION;

-- PaymentMethods: DB-driven list of payment options, admin can enable/disable/reorder
CREATE TABLE PaymentMethods (
    Id           TINYINT       NOT NULL CONSTRAINT PK_PaymentMethods PRIMARY KEY,
    Name         NVARCHAR(50)  NOT NULL,
    Code         NVARCHAR(20)  NOT NULL,
    IsEnabled    BIT           NOT NULL DEFAULT 1,
    DisplayOrder TINYINT       NOT NULL DEFAULT 0,
    IconUrl      NVARCHAR(300) NULL,
    Description  NVARCHAR(200) NULL,
    CreatedAt    DATETIME2     NOT NULL DEFAULT dbo.fn_NepalNow(),
    UpdatedAt    DATETIME2     NULL,
    CONSTRAINT UQ_PaymentMethods_Code UNIQUE (Code)
);

-- IDs match existing Orders.PaymentMethod tinyint values (1/2/3) for zero-data-migration
INSERT INTO PaymentMethods (Id, Name, Code, IsEnabled, DisplayOrder, Description) VALUES
(1, 'Cash on Delivery', 'cod',    1, 3, 'Pay with cash when your order arrives'),
(2, 'eSewa',            'esewa',  1, 1, 'Pay online via eSewa digital wallet'),
(3, 'Khalti',           'khalti', 1, 2, 'Pay online via Khalti digital wallet');

-- Payments: individual transaction records; one order may have Advance + Balance rows
CREATE TABLE Payments (
    Id                   INT           IDENTITY(1,1) PRIMARY KEY,
    OrderId              INT           NOT NULL CONSTRAINT FK_Payments_Orders   REFERENCES Orders(Id),
    PaymentMethodId      TINYINT       NOT NULL CONSTRAINT FK_Payments_Methods  REFERENCES PaymentMethods(Id),
    PaymentType          TINYINT       NOT NULL DEFAULT 1,  -- 1=Full 2=Advance 3=Balance
    Amount               DECIMAL(10,2) NOT NULL,
    Status               TINYINT       NOT NULL DEFAULT 1,  -- 1=Pending 2=Completed 3=Failed 4=Refunded
    GatewayTransactionId NVARCHAR(200) NULL,
    GatewayResponse      NVARCHAR(MAX) NULL,
    PaidAt               DATETIME2     NULL,
    CreatedAt            DATETIME2     NOT NULL DEFAULT dbo.fn_NepalNow(),
    UpdatedAt            DATETIME2     NULL
);

CREATE INDEX IX_Payments_OrderId ON Payments(OrderId);
CREATE INDEX IX_Payments_Status  ON Payments(Status);

-- AdvanceAmount: the deposit amount captured at order placement (0 when advance disabled)
ALTER TABLE Orders ADD AdvanceAmount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Payment settings stored as AppSettings keys
INSERT INTO AppSettings (SettingKey, Value) VALUES
('payment:advance:enabled',    '0'),    -- 0=disabled  1=enabled
('payment:advance:percent',    '30'),   -- % of order total required upfront
('payment:advance:min_amount', '100');  -- min order total (Rs) below which no advance is required

COMMIT TRANSACTION;
