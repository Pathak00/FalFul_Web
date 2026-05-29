USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MenuItemRoles')
CREATE TABLE MenuItemRoles (
    MenuItemId INT NOT NULL REFERENCES MenuItems(Id) ON DELETE CASCADE,
    RoleId     INT NOT NULL REFERENCES Roles(Id)     ON DELETE CASCADE,
    CONSTRAINT PK_MenuItemRoles PRIMARY KEY (MenuItemId, RoleId)
);
GO

-- Migrate any existing single-role data
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MenuItems' AND COLUMN_NAME = 'RequiredRoleId')
BEGIN
    INSERT INTO MenuItemRoles (MenuItemId, RoleId)
    SELECT Id, RequiredRoleId FROM MenuItems
    WHERE RequiredRoleId IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM MenuItemRoles mr WHERE mr.MenuItemId = MenuItems.Id AND mr.RoleId = MenuItems.RequiredRoleId);

    ALTER TABLE MenuItems DROP COLUMN RequiredRoleId;
END
GO
