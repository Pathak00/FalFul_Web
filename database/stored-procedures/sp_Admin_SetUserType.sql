USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Admin_SetUserType
    @UserId    INT,
    @UserType  TINYINT,
    @UpdatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET UserType = @UserType, UpdatedAt = dbo.fn_NepalNow(), UpdatedBy = @UpdatedBy
    WHERE Id = @UserId AND IsDeleted = 0;
END
GO

