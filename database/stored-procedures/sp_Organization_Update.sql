USE FalFulDb;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE sp_Organization_Update
    @Id           INT,
    @Name         NVARCHAR(150),
    @Description  NVARCHAR(500) = NULL,
    @ContactEmail NVARCHAR(150),
    @ContactPhone NVARCHAR(20),
    @Address      NVARCHAR(300) = NULL,
    @IsActive     BIT,
    @UpdatedBy    INT           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Organizations
    SET Name         = @Name,
        Description  = @Description,
        ContactEmail = @ContactEmail,
        ContactPhone = @ContactPhone,
        Address      = @Address,
        IsActive     = @IsActive,
        UpdatedAt    = dbo.fn_NepalNow(),
        UpdatedBy    = @UpdatedBy
    WHERE Id = @Id AND IsDeleted = 0;
END
GO


