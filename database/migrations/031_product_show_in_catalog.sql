-- Migration 031: Add ShowInCatalog to Products
--
-- Root cause: MinOrderGrams was being used as a dual-purpose signal:
--   (1) BYB config — minimum grams for cut-fruit ordering (correct use)
--   (2) Catalog exclusion — frontend filtered out any product with MinOrderGrams set
--
-- Fix: Introduce ShowInCatalog BIT (default 1) as an independent, explicit control.
-- A product can now participate in both the regular catalog AND Build Your Bowl
-- independently. MinOrderGrams retains its sole role as BYB configuration.
--
-- All existing products default to ShowInCatalog = 1 (no disruption).

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'ShowInCatalog'
)
BEGIN
    ALTER TABLE Products ADD ShowInCatalog BIT NOT NULL DEFAULT 1;
END
GO
