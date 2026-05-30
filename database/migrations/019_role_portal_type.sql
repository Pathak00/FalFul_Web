-- Add PortalType to Roles so routing is fully DB-driven (no hardcoded role/perm names)
ALTER TABLE Roles ADD PortalType NVARCHAR(20) NOT NULL DEFAULT 'admin';
GO

-- Seed known portal types for existing roles
UPDATE Roles SET PortalType = 'rider'    WHERE NormalizedName = 'RIDER';
UPDATE Roles SET PortalType = 'customer' WHERE NormalizedName IN ('CUSTOMER', 'USER');
-- All other roles (Admin, Staff, SuperAdmin, Manager, etc.) keep the default 'admin'
