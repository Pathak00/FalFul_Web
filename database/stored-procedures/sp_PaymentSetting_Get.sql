SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_PaymentSetting_Get
AS
BEGIN
    SET NOCOUNT ON;

    -- Returns all payment:* keys in one round-trip
    SELECT SettingKey, Value
    FROM   AppSettings
    WHERE  SettingKey LIKE 'payment:%'
    ORDER  BY SettingKey;
END
