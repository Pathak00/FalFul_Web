-- Make DeliveryAddressId nullable and add address snapshot columns to Orders
-- This allows orders to be placed with a manually entered address (no saved address)
ALTER TABLE Orders ALTER COLUMN DeliveryAddressId INT NULL;

ALTER TABLE Orders ADD FullAddress   NVARCHAR(300) NULL;
ALTER TABLE Orders ADD City          NVARCHAR(100) NULL;
ALTER TABLE Orders ADD DeliveryPhone NVARCHAR(20)  NULL;
ALTER TABLE Orders ADD AddressLabel  NVARCHAR(50)  NULL;
ALTER TABLE Orders ADD Landmark      NVARCHAR(200) NULL;
