SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_PaymentMethod_GetAll
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Name, Code, IsEnabled, DisplayOrder, IconUrl, Description, CreatedAt, UpdatedAt
    FROM   PaymentMethods
    ORDER  BY DisplayOrder, Id;
END
