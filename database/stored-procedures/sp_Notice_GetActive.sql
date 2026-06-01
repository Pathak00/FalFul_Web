SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Notice_GetActive
    @UserType TINYINT = NULL   -- 1=Individual 2=Organization NULL=all/public
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Today DATE = CAST(dbo.fn_NepalNow() AS DATE);

    SELECT Id, Title, Message, NoticeType, Target, StartDate, EndDate, IsActive, ImageUrl, CreatedAt
    FROM   Notices
    WHERE  IsActive = 1
      AND  (StartDate IS NULL OR StartDate <= @Today)
      AND  (EndDate   IS NULL OR EndDate   >= @Today)
      AND  (
               Target = 1   -- All
            OR (@UserType = 1 AND Target = 2)  -- Customers
            OR (@UserType = 2 AND Target = 3)  -- Organizations
           )
    ORDER  BY CreatedAt DESC;
END
