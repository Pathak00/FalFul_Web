SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_OrderItem_Create
    @OrderId            INT,
    @ProductId          INT = NULL,
    @ProductName        NVARCHAR(200),
    @ProductSlug        NVARCHAR(220) = NULL,
    @ImageUrl           NVARCHAR(500) = NULL,
    @UnitPrice          DECIMAL(10,2),
    @Quantity           DECIMAL(10,2),
    @Unit               NVARCHAR(20),
    @TotalPrice         DECIMAL(10,2),
    @IsCustomBuild      BIT = 0,
    @CustomBuildDetails NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    INSERT INTO OrderItems (OrderId, ProductId, ProductName, ProductSlug, ImageUrl,
                            UnitPrice, Quantity, Unit, TotalPrice, IsCustomBuild, CustomBuildDetails)
    VALUES (@OrderId, @ProductId, @ProductName, @ProductSlug, @ImageUrl,
            @UnitPrice, @Quantity, @Unit, @TotalPrice, @IsCustomBuild, @CustomBuildDetails);
END
