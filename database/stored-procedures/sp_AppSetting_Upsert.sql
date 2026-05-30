SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_AppSetting_Upsert
    @Key   NVARCHAR(100),
    @Value NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    IF EXISTS (SELECT 1 FROM AppSettings WHERE SettingKey = @Key)
        UPDATE AppSettings SET Value = @Value, UpdatedAt = dbo.fn_NepalNow() WHERE SettingKey = @Key;
    ELSE
        INSERT INTO AppSettings (SettingKey, Value) VALUES (@Key, @Value);
END

