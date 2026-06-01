SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Creates a new (non-system) AdminNavItem.
-- IsSystem is always 0 for items created via this SP; system items are seeded
-- only via migrations and cannot be created or deleted through the admin UI.
CREATE OR ALTER PROCEDURE sp_AdminNavItem_Create
    @Label              NVARCHAR(100),
    @Route              NVARCHAR(500),
    @Icon               NVARCHAR(50)   = NULL,
    @GroupLabel         NVARCHAR(100)  = NULL,
    @DisplayOrder       INT            = 0,
    @IsVisible          BIT            = 1,
    @RequiredPermission NVARCHAR(50)   = NULL,
    @PortalScope        NVARCHAR(200)  = 'admin'
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AdminNavItems (Label, Route, Icon, GroupLabel, DisplayOrder, IsVisible, RequiredPermission, IsSystem, PortalScope)
    VALUES (@Label, @Route, @Icon, @GroupLabel, @DisplayOrder, @IsVisible, @RequiredPermission, 0, @PortalScope);

    SELECT SCOPE_IDENTITY() AS Id;
END
GO
