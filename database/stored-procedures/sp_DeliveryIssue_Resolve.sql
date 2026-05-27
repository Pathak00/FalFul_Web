SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_DeliveryIssue_Resolve
    @Id              INT,
    @ResolutionNotes NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;

    UPDATE DeliveryIssues
    SET    IsResolved      = 1,
           ResolvedAt      = GETUTCDATE(),
           ResolutionNotes = @ResolutionNotes
    WHERE  Id = @Id;
END
