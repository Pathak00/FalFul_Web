-- Migration 011: Role-Based Access Control (RBAC)
-- Adds Roles, UserRoles, Permissions, RolePermissions, UserPermissions tables.
-- Extends Deliveries with RiderUserId for rider-linked delivery filtering.

BEGIN TRANSACTION;

-- ── Roles ────────────────────────────────────────────────────────────────────
CREATE TABLE Roles (
    Id             INT           IDENTITY(1,1) PRIMARY KEY,
    Name           NVARCHAR(50)  NOT NULL,
    NormalizedName NVARCHAR(50)  NOT NULL,
    Description    NVARCHAR(200),
    CONSTRAINT UQ_Roles_NormalizedName UNIQUE (NormalizedName)
);

-- ── UserRoles ─────────────────────────────────────────────────────────────────
-- Each user has exactly one role. One-to-many table allows future expansion.
CREATE TABLE UserRoles (
    UserId     INT          NOT NULL,
    RoleId     INT          NOT NULL,
    AssignedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    AssignedBy INT,
    PRIMARY KEY (UserId, RoleId),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);

-- ── Permissions ───────────────────────────────────────────────────────────────
CREATE TABLE Permissions (
    Id          INT           IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(100) NOT NULL,
    DisplayName NVARCHAR(100) NOT NULL,
    Category    NVARCHAR(50)  NOT NULL DEFAULT 'General',
    SortOrder   INT           NOT NULL DEFAULT 0,
    CONSTRAINT UQ_Permissions_Name UNIQUE (Name)
);

-- ── RolePermissions ───────────────────────────────────────────────────────────
-- Default permissions granted to a role (used for Rider fixed defaults).
CREATE TABLE RolePermissions (
    RoleId       INT NOT NULL,
    PermissionId INT NOT NULL,
    PRIMARY KEY (RoleId, PermissionId),
    FOREIGN KEY (RoleId)       REFERENCES Roles(Id),
    FOREIGN KEY (PermissionId) REFERENCES Permissions(Id)
);

-- ── UserPermissions ───────────────────────────────────────────────────────────
-- Per-user overrides, primarily for Staff. Admin bypasses this table entirely.
CREATE TABLE UserPermissions (
    UserId       INT          NOT NULL,
    PermissionId INT          NOT NULL,
    Granted      BIT          NOT NULL DEFAULT 1,
    GrantedAt    DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    GrantedBy    INT,
    PRIMARY KEY (UserId, PermissionId),
    FOREIGN KEY (UserId)       REFERENCES Users(Id),
    FOREIGN KEY (PermissionId) REFERENCES Permissions(Id)
);

-- ── Deliveries: add RiderUserId ───────────────────────────────────────────────
ALTER TABLE Deliveries ADD RiderUserId INT NULL REFERENCES Users(Id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO Roles (Name, NormalizedName, Description) VALUES
('Admin',    'ADMIN',    'Full system access — all modules and settings'),
('Staff',    'STAFF',    'Configurable limited access assigned by admin'),
('Rider',    'RIDER',    'Delivery operations only — assigned deliveries'),
('Customer', 'CUSTOMER', 'Customer-facing features — orders, tracking, profile');

INSERT INTO Permissions (Name, DisplayName, Category, SortOrder) VALUES
-- Operations
('orders',       'Orders',               'Operations', 1),
('deliveries',   'Deliveries',           'Operations', 2),
-- Catalog
('categories',   'Categories',           'Catalog',    3),
('products',     'Products',             'Catalog',    4),
-- Administration
('users',        'Users',                'Admin',      5),
('reports',      'Reports',              'Admin',      6),
('settings',     'Settings',             'Admin',      7),
('price_config', 'Price Configuration',  'Admin',      8),
-- Content
('menus',        'Menus & Navigation',   'Content',    9),
('pages',        'Pages',                'Content',   10),
('banners',      'Banners',              'Content',   11),
('sections',     'Homepage Sections',    'Content',   12);

-- Rider default permissions (deliveries only)
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM   Roles r, Permissions p
WHERE  r.Name = 'Rider' AND p.Name = 'deliveries';

-- ── Migrate existing users to UserRoles ──────────────────────────────────────
-- Admin (UserType = 3) → Admin role
INSERT INTO UserRoles (UserId, RoleId)
SELECT u.Id, r.Id
FROM   Users u, Roles r
WHERE  u.UserType = 3 AND r.Name = 'Admin' AND u.IsDeleted = 0;

-- Individual / Organization (UserType = 1, 2) → Customer role
INSERT INTO UserRoles (UserId, RoleId)
SELECT u.Id, r.Id
FROM   Users u, Roles r
WHERE  u.UserType IN (1, 2) AND r.Name = 'Customer' AND u.IsDeleted = 0;

COMMIT TRANSACTION;
