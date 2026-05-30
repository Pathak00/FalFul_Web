SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_DeliveryIssue_Create
    @DeliveryId  INT,
    @IssueType   TINYINT,
    @ReportedBy  TINYINT,
    @Description NVARCHAR(1000)
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    INSERT INTO DeliveryIssues (DeliveryId, IssueType, ReportedBy, Description, ReportedAt, IsResolved)
    VALUES (@DeliveryId, @IssueType, @ReportedBy, @Description, dbo.fn_NepalNow(), 0);

    SELECT SCOPE_IDENTITY() AS Id;
END

