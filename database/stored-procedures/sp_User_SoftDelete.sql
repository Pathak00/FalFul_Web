USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_User_SoftDelete
    @UserId    INT,
    @DeletedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET IsDeleted = 1, IsActive = 0, UpdatedAt = dbo.fn_NepalNow(), UpdatedBy = @DeletedBy
    WHERE Id = @UserId;
END
GO

