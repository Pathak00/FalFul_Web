SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_AppSetting_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, SettingKey, Value, UpdatedAt
    FROM   AppSettings
    ORDER BY SettingKey;
END
