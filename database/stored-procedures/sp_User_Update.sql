USE FalFulDb;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE sp_User_Update
    @Id             INT,
    @FullName       NVARCHAR(100),
    @Email          NVARCHAR(150)  = NULL,
    @PhoneNumber    NVARCHAR(20)   = NULL,
    @ProfileImageUrl NVARCHAR(500) = NULL,
    @IsActive       BIT,
    @UpdatedBy      INT            = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET FullName        = @FullName,
        Email           = @Email,
        PhoneNumber     = @PhoneNumber,
        ProfileImageUrl = @ProfileImageUrl,
        IsActive        = @IsActive,
        UpdatedAt       = dbo.fn_NepalNow(),
        UpdatedBy       = @UpdatedBy
    WHERE Id = @Id AND IsDeleted = 0;
END
GO


