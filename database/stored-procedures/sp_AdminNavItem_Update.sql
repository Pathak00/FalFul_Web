SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Updates the appearance/order of an admin nav item.
-- RequiredPermission and IsSystem are intentionally not editable here.
CREATE OR ALTER PROCEDURE sp_AdminNavItem_Update
    @Id           INT,
    @Label        NVARCHAR(100),
    @Icon         NVARCHAR(50)  = NULL,
    @GroupLabel   NVARCHAR(100) = NULL,
    @DisplayOrder INT,
    @IsVisible    BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE AdminNavItems
    SET    Label        = @Label,
           Icon         = @Icon,
           GroupLabel   = @GroupLabel,
           DisplayOrder = @DisplayOrder,
           IsVisible    = @IsVisible
    WHERE  Id = @Id;
END
GO
