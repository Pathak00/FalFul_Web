SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Updates an AdminNavItem's display fields.
-- For CUSTOM items (IsSystem = 0): also allows changing RequiredPermission and PortalScope,
-- since an admin created those fields and should be able to correct them.
-- For SYSTEM items (IsSystem = 1): only label/icon/group/order/visible can change;
-- RequiredPermission and PortalScope are immutable (managed only via migrations).
CREATE OR ALTER PROCEDURE sp_AdminNavItem_Update
    @Id                 INT,
    @Label              NVARCHAR(100),
    @Icon               NVARCHAR(50)  = NULL,
    @GroupLabel         NVARCHAR(100) = NULL,
    @DisplayOrder       INT           = 0,
    @IsVisible          BIT           = 1,
    @RequiredPermission NVARCHAR(50)  = NULL,
    @PortalScope        NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM AdminNavItems WHERE Id = @Id AND IsSystem = 0)
    BEGIN
        -- Custom item: allow full update including permission and portal scope
        UPDATE AdminNavItems
        SET Label              = @Label,
            Icon               = @Icon,
            GroupLabel         = @GroupLabel,
            DisplayOrder       = @DisplayOrder,
            IsVisible          = @IsVisible,
            RequiredPermission = @RequiredPermission,
            PortalScope        = NULLIF(@PortalScope, '')
        WHERE Id = @Id;
    END
    ELSE
    BEGIN
        -- System item: appearance only (permission and scope are migration-managed)
        UPDATE AdminNavItems
        SET Label        = @Label,
            Icon         = @Icon,
            GroupLabel   = @GroupLabel,
            DisplayOrder = @DisplayOrder,
            IsVisible    = @IsVisible
        WHERE Id = @Id;
    END
END
GO
