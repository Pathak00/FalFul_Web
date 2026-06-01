SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
-- Updates an AdminNavItem.
--
-- SYSTEM items (IsSystem = 1):
--   Label, Icon, GroupLabel, DisplayOrder, IsVisible, PortalScope  — all editable.
--   RequiredPermission — IMMUTABLE (security-critical, managed only via migrations).
--
-- CUSTOM items (IsSystem = 0):
--   All fields editable, including RequiredPermission.
--
-- PortalScope is a comma-separated list of portal types (e.g. 'admin,rider').
-- NULL = visible in all portals. Both system and custom items need this to be
-- configurable at runtime so admins can control which portal sees which item.
CREATE OR ALTER PROCEDURE sp_AdminNavItem_Update
    @Id                 INT,
    @Label              NVARCHAR(100),
    @Icon               NVARCHAR(50)  = NULL,
    @GroupLabel         NVARCHAR(100) = NULL,
    @DisplayOrder       INT           = 0,
    @IsVisible          BIT           = 1,
    @RequiredPermission NVARCHAR(50)  = NULL,
    @PortalScope        NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM AdminNavItems WHERE Id = @Id AND IsSystem = 0)
    BEGIN
        -- Custom item: full update including RequiredPermission and PortalScope
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
        -- System item: everything EXCEPT RequiredPermission (permission is migration-managed)
        UPDATE AdminNavItems
        SET Label        = @Label,
            Icon         = @Icon,
            GroupLabel   = @GroupLabel,
            DisplayOrder = @DisplayOrder,
            IsVisible    = @IsVisible,
            PortalScope  = NULLIF(@PortalScope, '')
        WHERE Id = @Id;
    END
END
GO
