-- Migration 030: Add Mrp (Maximum Retail Price) to Products
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'Mrp'
)
BEGIN
    ALTER TABLE Products ADD Mrp DECIMAL(10,2) NULL;
END
