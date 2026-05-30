USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_MenuItem_Delete
    @Id        INT,
    @DeletedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- Soft-delete children first
    UPDATE MenuItems SET IsDeleted = 1, UpdatedAt = dbo.fn_NepalNow(), UpdatedBy = @DeletedBy
    WHERE ParentId = @Id AND IsDeleted = 0;
    -- Soft-delete the item itself
    UPDATE MenuItems SET IsDeleted = 1, UpdatedAt = dbo.fn_NepalNow(), UpdatedBy = @DeletedBy
    WHERE Id = @Id;
END
GO

