SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Notice_Update
    @Id         INT,
    @Title      NVARCHAR(200),
    @Message    NVARCHAR(1000),
    @NoticeType TINYINT,
    @Target     TINYINT,
    @StartDate  DATE          = NULL,
    @EndDate    DATE          = NULL,
    @IsActive   BIT,
    @ImageUrl   NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Notices
    SET    Title = @Title, Message = @Message, NoticeType = @NoticeType,
           Target = @Target, StartDate = @StartDate, EndDate = @EndDate,
           IsActive = @IsActive, ImageUrl = @ImageUrl
    WHERE  Id = @Id;
END
