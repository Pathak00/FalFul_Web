USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Admin_SetUserActive
    @UserId    INT,
    @IsActive  BIT,
    @UpdatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET IsActive = @IsActive, UpdatedAt = GETUTCDATE(), UpdatedBy = @UpdatedBy
    WHERE Id = @UserId AND IsDeleted = 0;
END
GO
