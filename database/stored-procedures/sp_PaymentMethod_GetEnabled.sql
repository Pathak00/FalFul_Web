SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_PaymentMethod_GetEnabled
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Name, Code, DisplayOrder, IconUrl, Description
    FROM   PaymentMethods
    WHERE  IsEnabled = 1
    ORDER  BY DisplayOrder, Id;
END
