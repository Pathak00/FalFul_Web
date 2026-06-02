-- =============================================================================
-- Migration 037: Homepage Statistics Settings
--
-- Adds 12 AppSettings that control the four stat counters displayed
-- on the public home page. Each stat has a numeric value (used for
-- the count-up animation), a display suffix, and a label.
--
-- Keys:  homepage_stat_{1-4}_value   (integer as string, e.g. "2400")
--         homepage_stat_{1-4}_suffix  (display suffix,   e.g. "+", "k+", "")
--         homepage_stat_{1-4}_label   (text label,        e.g. "Happy Customers")
-- =============================================================================

BEGIN TRANSACTION;

MERGE AppSettings AS target
USING (VALUES
    -- Stat 1: Happy Customers
    ('homepage_stat_1_value',  '2400'),
    ('homepage_stat_1_suffix', '+'),
    ('homepage_stat_1_label',  'Happy Customers'),
    -- Stat 2: Orders Delivered
    ('homepage_stat_2_value',  '15'),
    ('homepage_stat_2_suffix', 'k+'),
    ('homepage_stat_2_label',  'Orders Delivered'),
    -- Stat 3: Fruit Varieties
    ('homepage_stat_3_value',  '50'),
    ('homepage_stat_3_suffix', '+'),
    ('homepage_stat_3_label',  'Fruit Varieties'),
    -- Stat 4: Cities Covered
    ('homepage_stat_4_value',  '5'),
    ('homepage_stat_4_suffix', ''),
    ('homepage_stat_4_label',  'Cities Covered')
) AS src (SettingKey, Value)
ON target.SettingKey = src.SettingKey
WHEN NOT MATCHED THEN
    INSERT (SettingKey, Value, UpdatedAt)
    VALUES (src.SettingKey, src.Value, DATEADD(MINUTE, 345, GETUTCDATE()));

COMMIT TRANSACTION;
