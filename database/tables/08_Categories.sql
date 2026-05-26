CREATE TABLE Categories (
    Id          INT             IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(100)   NOT NULL,
    Slug        NVARCHAR(120)   NOT NULL UNIQUE,
    Description NVARCHAR(500)   NULL,
    Icon        NVARCHAR(60)    NULL,          -- Bootstrap Icon class e.g. bi-apple
    ImageUrl    NVARCHAR(500)   NULL,
    DisplayOrder INT            NOT NULL DEFAULT 0,
    IsActive    BIT             NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt   DATETIME2       NULL
);

-- Seed categories
INSERT INTO Categories (Name, Slug, Description, Icon, DisplayOrder, IsActive)
VALUES
    ('Fresh Fruits',    'fresh-fruits',    'Whole fresh fruits sold by KG',        'bi-basket2-fill',      1, 1),
    ('Cut Fruits',      'cut-fruits',      'Pre-cut and ready-to-eat fruit pieces', 'bi-scissors',          2, 1),
    ('Fruit Bowls',     'fruit-bowls',     'Prepared mixed fruit bowls',            'bi-cup-straw',         3, 1),
    ('Fruit Packs',     'fruit-packs',     'Curated fruit pack boxes',              'bi-box-seam',          4, 1),
    ('Seasonal',        'seasonal',        'Seasonal special fruit offerings',      'bi-calendar2-heart',   5, 1);
