USE FalFulDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MenuItems' AND xtype='U')
BEGIN
    CREATE TABLE MenuItems (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        ParentId     INT NULL REFERENCES MenuItems(Id),
        Label        NVARCHAR(100)  NOT NULL,
        Url          NVARCHAR(500)  NULL,
        Icon         NVARCHAR(50)   NULL,
        DisplayOrder INT            NOT NULL DEFAULT 0,
        IsVisible    BIT            NOT NULL DEFAULT 1,
        -- 0=Everyone  1=AnyLoggedIn  2=GuestOnly  3=AdminOnly  4=OrgOnly  5=IndividualOnly
        VisibleTo    TINYINT        NOT NULL DEFAULT 0,
        OpenInNewTab BIT            NOT NULL DEFAULT 0,
        IsDeleted    BIT            NOT NULL DEFAULT 0,
        CreatedAt    DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt    DATETIME2      NULL,
        CreatedBy    INT            NULL,
        UpdatedBy    INT            NULL
    );

    -- Seed default navigation (icons use Bootstrap Icons class names, e.g. bi-house-fill)
    INSERT INTO MenuItems (Label, Url, Icon, DisplayOrder, IsVisible, VisibleTo) VALUES
        ('Home',       '/',           'bi-house-fill',  1, 1, 0),
        ('Products',   '/products',   'bi-cart-fill',   2, 1, 0),
        ('Dashboard',  '/dashboard',  'bi-speedometer2',3, 1, 1),
        ('Admin',      '/admin',      'bi-shield-fill', 4, 1, 3);

    -- Sub-menu items under Admin (ParentId = 4)
    INSERT INTO MenuItems (ParentId, Label, Url, Icon, DisplayOrder, IsVisible, VisibleTo) VALUES
        (4, 'Overview',          '/admin',          'bi-speedometer2',               1, 1, 3),
        (4, 'Menus',             '/admin/menus',    'bi-list-nested',                2, 1, 3),
        (4, 'Pages',             '/admin/pages',    'bi-file-earmark-text',          3, 1, 3),
        (4, 'Banners',           '/admin/banners',  'bi-images',                     4, 1, 3),
        (4, 'Homepage Sections', '/admin/sections', 'bi-layout-text-window-reverse', 5, 1, 3),
        (4, 'Users',             '/admin/users',       'bi-people',                     6, 1, 3),
        (4, 'Categories',        '/admin/categories', 'bi-tags',                       7, 1, 3),
        (4, 'Products',          '/admin/products',   'bi-box-seam',                   8, 1, 3);

    PRINT 'MenuItems table created and seeded.';
END
ELSE
    PRINT 'MenuItems table already exists.';
GO
