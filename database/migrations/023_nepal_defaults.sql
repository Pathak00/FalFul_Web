-- Migration 023: Change all DEFAULT GETUTCDATE() column constraints to dbo.fn_NepalNow()
--
-- Migration 022 converted existing data but left the column DEFAULTs pointing at
-- GETUTCDATE(). New inserts after 022 got UTC timestamps, breaking ORDER BY CreatedAt.
-- This migration drops and recreates each affected DEFAULT constraint.

DECLARE @sql   NVARCHAR(MAX);
DECLARE @table NVARCHAR(128);
DECLARE @col   NVARCHAR(128);
DECLARE @cname NVARCHAR(128);

DECLARE cur CURSOR FOR
    SELECT
        t.name  AS TableName,
        c.name  AS ColumnName,
        dc.name AS ConstraintName
    FROM   sys.default_constraints dc
    JOIN   sys.columns             c  ON c.object_id     = dc.parent_object_id
                                     AND c.column_id     = dc.parent_column_id
    JOIN   sys.tables              t  ON t.object_id     = dc.parent_object_id
    WHERE  dc.definition LIKE '%GETUTCDATE%'
      AND  t.is_ms_shipped = 0;

OPEN cur;
FETCH NEXT FROM cur INTO @table, @col, @cname;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'ALTER TABLE [' + @table + N'] DROP CONSTRAINT [' + @cname + N']; '
             + N'ALTER TABLE [' + @table + N'] ADD CONSTRAINT [' + @cname + N'] DEFAULT dbo.fn_NepalNow() FOR [' + @col + N'];';
    EXEC sp_executesql @sql;
    FETCH NEXT FROM cur INTO @table, @col, @cname;
END

CLOSE cur;
DEALLOCATE cur;
