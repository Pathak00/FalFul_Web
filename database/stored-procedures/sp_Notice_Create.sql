SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Notice_Create
    @Title      NVARCHAR(200),
    @Message    NVARCHAR(1000),
    @NoticeType TINYINT        = 1,
    @Target     TINYINT        = 1,
    @StartDate  DATE           = NULL,
    @EndDate    DATE           = NULL,
    @IsActive   BIT            = 1,
    @ImageUrl   NVARCHAR(500)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Notices (Title, Message, NoticeType, Target, StartDate, EndDate, IsActive, ImageUrl)
    VALUES (@Title, @Message, @NoticeType, @Target, @StartDate, @EndDate, @IsActive, @ImageUrl);
    SELECT SCOPE_IDENTITY() AS Id;
END
