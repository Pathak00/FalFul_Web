-- Migration 029: Add ImageUrl to Notices table
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Notices') AND name = 'ImageUrl'
)
BEGIN
    ALTER TABLE Notices ADD ImageUrl NVARCHAR(500) NULL;
END
