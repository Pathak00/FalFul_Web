CREATE TABLE Products (
    Id               INT             IDENTITY(1,1) PRIMARY KEY,
    CategoryId       INT             NOT NULL REFERENCES Categories(Id),
    Name             NVARCHAR(200)   NOT NULL,
    Slug             NVARCHAR(220)   NOT NULL UNIQUE,
    Description      NVARCHAR(2000)  NULL,
    ShortDescription NVARCHAR(300)   NULL,
    Price            DECIMAL(10,2)   NOT NULL,
    Unit             NVARCHAR(20)    NOT NULL DEFAULT 'KG',  -- KG, Piece, Box, Bowl
    Stock            DECIMAL(10,2)   NOT NULL DEFAULT 0,
    IsAvailable      BIT             NOT NULL DEFAULT 1,
    IsFeatured       BIT             NOT NULL DEFAULT 0,
    ImageUrl         NVARCHAR(500)   NULL,
    Tags             NVARCHAR(500)   NULL,      -- comma-separated
    DisplayOrder     INT             NOT NULL DEFAULT 0,
    CreatedAt        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt        DATETIME2       NULL,
    IsDeleted        BIT             NOT NULL DEFAULT 0
);

-- Seed products
INSERT INTO Products (CategoryId, Name, Slug, ShortDescription, Description, Price, Unit, Stock, IsAvailable, IsFeatured, ImageUrl, Tags, DisplayOrder)
VALUES
    (1, 'Fresh Mango',       'fresh-mango',       'Sweet Nepali mangoes sold per KG',      'Premium quality fresh mangoes sourced directly from local farms. Sweet, juicy, and full of flavor.',   250.00, 'KG',    50.0,  1, 1, NULL, 'mango,tropical,summer', 1),
    (1, 'Royal Watermelon',  'royal-watermelon',  'Large seedless watermelons per KG',     'Crisp and refreshing seedless watermelons. Perfect for summer days.',                                  120.00, 'KG',    80.0,  1, 1, NULL, 'watermelon,summer,seedless', 2),
    (1, 'Pink Lady Apple',   'pink-lady-apple',   'Imported crisp apples per KG',          'Premium imported Pink Lady apples — sweet with a hint of tartness.',                                  380.00, 'KG',    30.0,  1, 0, NULL, 'apple,imported,crisp', 3),
    (1, 'Banana Bunch',      'banana-bunch',      'Fresh local bananas per KG',            'Organic local bananas, perfectly ripened for the best taste.',                                         80.00, 'KG',   100.0,  1, 0, NULL, 'banana,local,organic', 4),
    (2, 'Mango Slices',      'mango-slices',      'Ready-to-eat mango slices (300g box)',  'Freshly cut mango slices — packed in a hygienic 300g box. Ready to eat.',                            199.00, 'Box',   40.0,  1, 1, NULL, 'mango,cut,ready', 1),
    (2, 'Pineapple Chunks',  'pineapple-chunks',  'Fresh pineapple chunks (300g box)',     'Golden pineapple chunks cut fresh daily. Sweet and tangy.',                                           149.00, 'Box',   35.0,  1, 0, NULL, 'pineapple,cut,fresh', 2),
    (3, 'Classic Fruit Bowl','classic-fruit-bowl','Mixed seasonal fruits bowl (500g)',     'A vibrant mix of seasonal fruits — watermelon, mango, pineapple, and grapes. Fresh daily.',          299.00, 'Bowl',  25.0,  1, 1, NULL, 'mixed,bowl,seasonal', 1),
    (3, 'Tropical Bowl',     'tropical-bowl',     'Exotic tropical fruits bowl (500g)',    'Exotic tropical blend: mango, papaya, dragon fruit, and kiwi. A taste of the tropics.',              449.00, 'Bowl',  20.0,  1, 0, NULL, 'tropical,exotic,bowl', 2),
    (4, 'Family Fruit Box',  'family-fruit-box',  'Assorted fresh fruits box (3kg)',       'A carefully curated box of 3kg assorted fresh fruits. Perfect for families.',                         699.00, 'Box',   15.0,  1, 1, NULL, 'family,box,assorted', 1),
    (4, 'Office Fresh Pack', 'office-fresh-pack', 'Weekly fresh fruits pack (5kg)',        'Keep your office refreshed with 5kg of hand-picked fresh seasonal fruits. Weekly order available.',  999.00, 'Box',   10.0,  1, 0, NULL, 'office,pack,bulk', 2);
