-- Migration 009: App Settings
-- Creates a key-value settings store for admin-configurable text/policy values.

BEGIN TRANSACTION;

CREATE TABLE AppSettings (
    Id         INT           IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) NOT NULL,
    Value      NVARCHAR(MAX) NOT NULL,
    UpdatedAt  DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_AppSettings_Key UNIQUE (SettingKey)
);

-- Seed default settings
INSERT INTO AppSettings (SettingKey, Value) VALUES
('cancellation_policy_text', 'Orders can only be cancelled before admin confirmation. Once your order is confirmed, cancellation is no longer possible.');

COMMIT TRANSACTION;
