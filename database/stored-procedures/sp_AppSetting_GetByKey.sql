SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_AppSetting_GetByKey
    @Key NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, SettingKey, Value, UpdatedAt
    FROM   AppSettings
    WHERE  SettingKey = @Key;
END
