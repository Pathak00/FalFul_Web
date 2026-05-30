-- Migration 027: Advance Payment Workflow Refactor
-- Adds delivery completion fields and delivery proof requirement setting.
-- OrderStatus 7 = AwaitingPayment is handled in the application enum only; no DB constraint change needed.

BEGIN TRANSACTION;

-- Track what the rider collected at delivery and optional proof photo
ALTER TABLE Deliveries ADD
    CollectedAmount   DECIMAL(10,2) NULL,
    ProofPhotoUrl     NVARCHAR(500) NULL,
    CollectionRemarks NVARCHAR(500) NULL;

-- When enabled, rider must upload a photo/URL as proof before marking Delivered
INSERT INTO AppSettings (SettingKey, Value) VALUES
('delivery:require_proof', '0');

COMMIT TRANSACTION;
