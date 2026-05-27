-- Migration 007: Add CutFruitPrice to Products
-- Separates cut-fruit pricing from per-KG pricing so they are fully independent.
--
-- Field semantics after this migration:
--   Price           = per-KG price (used on product pages and per-KG purchases)
--   CutFruitPrice   = base price at MinOrderGrams (used for cut portions and Build Your Bowl)
--   MinOrderGrams   = minimum grams for a cut-fruit order
--   GramStep        = per-product increment step for cut-fruit orders
--
-- Build Your Bowl ALWAYS uses CutFruitPrice + MinOrderGrams + GramStep.
-- Per-KG purchases ALWAYS use Price. These fields never cross-apply.

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'CutFruitPrice'
)
BEGIN
    ALTER TABLE Products ADD CutFruitPrice DECIMAL(10,2) NULL;
END
GO
