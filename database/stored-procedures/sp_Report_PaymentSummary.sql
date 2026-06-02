SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE sp_Report_PaymentSummary
    @FromDate DATE = NULL,
    @ToDate   DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: overall totals
    SELECT
        COUNT(*)                                               AS TotalTransactions,
        SUM(CASE WHEN Status = 2 THEN Amount ELSE 0 END)      AS TotalCollected,
        SUM(CASE WHEN Status = 1 THEN Amount ELSE 0 END)      AS TotalPending,
        SUM(CASE WHEN Status = 4 THEN Amount ELSE 0 END)      AS TotalRefunded,
        SUM(CASE WHEN PaymentType = 2 THEN Amount ELSE 0 END) AS TotalAdvance,
        SUM(CASE WHEN PaymentType = 3 THEN Amount ELSE 0 END) AS TotalBalance
    FROM Payments
    WHERE (@FromDate IS NULL OR CAST(CreatedAt AS DATE) >= @FromDate)
      AND (@ToDate   IS NULL OR CAST(CreatedAt AS DATE) <= @ToDate);

    -- Result set 2: breakdown by payment method
    SELECT pm.Id, pm.Name, pm.Code,
           COUNT(p.Id)                                            AS TransactionCount,
           SUM(CASE WHEN p.Status = 2 THEN p.Amount ELSE 0 END)  AS Collected,
           SUM(CASE WHEN p.Status = 1 THEN p.Amount ELSE 0 END)  AS Pending
    FROM   PaymentMethods pm
    LEFT   JOIN Payments p ON p.PaymentMethodId = pm.Id
        AND (@FromDate IS NULL OR CAST(p.CreatedAt AS DATE) >= @FromDate)
        AND (@ToDate   IS NULL OR CAST(p.CreatedAt AS DATE) <= @ToDate)
    GROUP  BY pm.Id, pm.Name, pm.Code, pm.DisplayOrder
    ORDER  BY pm.DisplayOrder;

    -- Result set 3: breakdown by status
    SELECT p.Status,
           COUNT(*)    AS Count,
           SUM(Amount) AS Total
    FROM   Payments p
    WHERE  (@FromDate IS NULL OR CAST(p.CreatedAt AS DATE) >= @FromDate)
      AND  (@ToDate   IS NULL OR CAST(p.CreatedAt AS DATE) <= @ToDate)
    GROUP  BY p.Status;
END
