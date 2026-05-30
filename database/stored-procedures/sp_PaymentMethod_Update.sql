SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_PaymentMethod_Update
    @Id          TINYINT,
    @IsEnabled   BIT           = NULL,
    @DisplayOrder TINYINT      = NULL,
    @IconUrl     NVARCHAR(300) = NULL,
    @Description NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE PaymentMethods
    SET IsEnabled    = COALESCE(@IsEnabled,    IsEnabled),
        DisplayOrder = COALESCE(@DisplayOrder, DisplayOrder),
        IconUrl      = COALESCE(@IconUrl,      IconUrl),
        Description  = COALESCE(@Description,  Description),
        UpdatedAt    = dbo.fn_NepalNow()
    WHERE Id = @Id;
END
