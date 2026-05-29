-- Migration 018: Dynamic Admin Navigation
-- Adds AdminNavItems table — stores the admin sidebar navigation items with
-- their required permission keys. Replaces the hardcoded admin-layout sidebar.

BEGIN TRANSACTION;

CREATE TABLE AdminNavItems (
    Id                 INT           IDENTITY(1,1) PRIMARY KEY,
    Label              NVARCHAR(100) NOT NULL,
    Route              NVARCHAR(500) NOT NULL,
    Icon               NVARCHAR(50)  NULL,
    ParentId           INT           NULL REFERENCES AdminNavItems(Id),
    GroupLabel         NVARCHAR(100) NULL,       -- section header (NULL = no header)
    DisplayOrder       INT           NOT NULL DEFAULT 0,
    IsVisible          BIT           NOT NULL DEFAULT 1,
    RequiredPermission NVARCHAR(50)  NULL,       -- maps to Permissions.Name; NULL = always shown
    IsSystem           BIT           NOT NULL DEFAULT 1  -- system items cannot be deleted
);

-- ── Seed: mirrors the current hardcoded admin-layout sidebar ─────────────────
INSERT INTO AdminNavItems (Label, Route, Icon, GroupLabel, DisplayOrder, RequiredPermission, IsSystem) VALUES
-- Dashboard (always shown — no permission required)
('Dashboard',       '/admin',              'bi-speedometer2',               NULL,               0,   NULL,          1),
-- Content
('Site Navigation', '/admin/menus',        'bi-list-nested',                'Content',         10,   'menus',       1),
('Pages',           '/admin/pages',        'bi-file-earmark-text',          'Content',         20,   'pages',       1),
('Banners',         '/admin/banners',      'bi-image',                      'Content',         30,   'banners',     1),
('Homepage',        '/admin/sections',     'bi-layout-text-window-reverse', 'Content',         40,   'sections',    1),
-- Catalog
('Categories',      '/admin/categories',   'bi-tags',                       'Catalog',         50,   'categories',  1),
('Products',        '/admin/products',     'bi-box-seam',                   'Catalog',         60,   'products',    1),
-- Operations
('Orders',          '/admin/orders',       'bi-bag-check',                  'Operations',      70,   'orders',      1),
('Deliveries',      '/admin/deliveries',   'bi-bicycle',                    'Operations',      80,   'deliveries',  1),
('Reports',         '/admin/reports',      'bi-bar-chart-line',             'Operations',      90,   'reports',     1),
('Price Config',    '/admin/price-config', 'bi-sliders',                    'Operations',     100,   'price_config',1),
('Settings',        '/admin/settings',     'bi-gear',                       'Operations',     110,   'settings',    1),
-- User Management
('Users',           '/admin/users',        'bi-people',                     'User Management', 120,   'users',       1),
('Roles',           '/admin/roles',        'bi-shield-lock',                'User Management', 130,   'system',      1),
('Navigation',      '/admin/nav',          'bi-menu-button-wide',           'User Management', 140,   'system',      1);

COMMIT TRANSACTION;
