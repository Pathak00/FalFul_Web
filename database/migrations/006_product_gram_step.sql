-- Migration 006: Add GramStep to Products
-- GramStep (INT NULL): per-product increment step in grams for cut fruits.
-- When set, Build Your Bowl uses this step instead of the global cut_fruit_gram_step price rule.
-- Price field semantics for cut-fruit products (MinOrderGrams > 0):
--   price = base price at MinOrderGrams (NOT per-KG).
--   Pricing for X grams = (X / MinOrderGrams) * Price.

ALTER TABLE Products ADD GramStep INT NULL;
GO
