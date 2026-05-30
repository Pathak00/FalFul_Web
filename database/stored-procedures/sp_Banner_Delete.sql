USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Banner_Delete
    @Id        INT,
    @DeletedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Banners SET IsDeleted = 1, UpdatedAt = dbo.fn_NepalNow(), UpdatedBy = @DeletedBy
    WHERE Id = @Id AND IsDeleted = 0;
END
GO

