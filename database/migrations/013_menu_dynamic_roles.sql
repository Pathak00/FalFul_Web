USE FalFulDb;
GO
-- Add RequiredRoleId to MenuItems for role-specific visibility
-- VisibleTo: 0=Everyone, 1=AnyLoggedIn, 2=GuestOnly, 3=SpecificRole (RequiredRoleId)
-- Old values 3/4/5 (Admin/Org/Individual by UserType) are migrated to 1 (AnyLoggedIn)

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MenuItems' AND COLUMN_NAME = 'RequiredRoleId')
    ALTER TABLE MenuItems ADD RequiredRoleId INT NULL REFERENCES Roles(Id);
GO

UPDATE MenuItems SET VisibleTo = 1 WHERE VisibleTo IN (3, 4, 5);
GO
