SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Notice_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Title, Message, NoticeType, Target, StartDate, EndDate, IsActive, ImageUrl, CreatedAt
    FROM   Notices
    ORDER  BY CreatedAt DESC;
END
