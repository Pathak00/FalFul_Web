USE FalFulDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HomepageSections' AND xtype='U')
BEGIN
    CREATE TABLE HomepageSections (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        SectionKey   NVARCHAR(100)   NOT NULL,  -- e.g. hero, features, promo_1
        Title        NVARCHAR(200)   NULL,
        Subtitle     NVARCHAR(500)   NULL,
        Content      NVARCHAR(MAX)   NULL,
        IsVisible    BIT             NOT NULL DEFAULT 1,
        DisplayOrder INT             NOT NULL DEFAULT 0,
        UpdatedAt    DATETIME2       NULL,
        UpdatedBy    INT             NULL,
        CONSTRAINT UQ_HomepageSections_Key UNIQUE (SectionKey)
    );

    -- Seed default section keys that the landing page references
    INSERT INTO HomepageSections (SectionKey, Title, Subtitle, IsVisible, DisplayOrder)
    VALUES
        ('hero',     'Premium Fruits, Delivered Fresh',       'Order the finest fresh fruits online.', 1, 1),
        ('features', 'Everything you love about fresh fruit', 'From farm to your doorstep.',           1, 2),
        ('products', 'Fresh picks, just for you',             'Handpicked seasonal fruits daily.',     1, 3),
        ('how',      'From orchard to doorstep',              'Four simple steps.',                    1, 4),
        ('stats',    'The Numbers',                           '2,400+ happy customers and counting.',  1, 5),
        ('promo',    'Summer Mango Fest',                     'Get 20% off all mango varieties.',      1, 6);

    PRINT 'HomepageSections table created and seeded.';
END
ELSE
    PRINT 'HomepageSections table already exists.';
GO
