CREATE OR ALTER PROCEDURE sp_Report_DeliverySummary
    @FromDate DATE = NULL,
    @ToDate   DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @FromDate = ISNULL(@FromDate, CAST(DATEADD(DAY, -30, dbo.fn_NepalNow()) AS DATE));
    SET @ToDate   = ISNULL(@ToDate,   CAST(dbo.fn_NepalNow() AS DATE));

    -- Result set 1: summary row
    -- New statuses: 1=AwaitingRider, 2=Assigned, 3=PickedUp, 4=OutForDelivery,
    --               5=Delivered, 6=Failed, 7=Returned
    SELECT
        COUNT(*)                                                                  AS TotalDeliveries,
        SUM(CASE WHEN d.Status = 5              THEN 1 ELSE 0 END)               AS Delivered,
        SUM(CASE WHEN d.Status IN (6, 7)        THEN 1 ELSE 0 END)               AS Failed,
        SUM(CASE WHEN d.Status IN (1, 2, 3, 4)  THEN 1 ELSE 0 END)               AS InProgress,
        CAST(
            CASE WHEN COUNT(*) > 0
                 THEN SUM(CASE WHEN d.Status = 5 THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*)
                 ELSE 0 END AS DECIMAL(5,2))                                      AS SuccessRate,
        CAST(AVG(CAST(d.AttemptCount AS FLOAT)) AS DECIMAL(4,2))                 AS AvgAttempts,
        CAST(AVG(CAST(r.OverallRating AS FLOAT)) AS DECIMAL(3,2))                AS AvgRating
    FROM   Deliveries d
    LEFT   JOIN OrderRatings r ON r.OrderId = d.OrderId
    WHERE  d.ScheduledDate BETWEEN @FromDate AND @ToDate;

    -- Result set 2: failure reason breakdown
    SELECT da.FailureReason, COUNT(*) AS Count
    FROM   DeliveryAttempts da
    INNER  JOIN Deliveries d ON d.Id = da.DeliveryId
    WHERE  da.WasSuccessful = 0
      AND  da.FailureReason IS NOT NULL
      AND  d.ScheduledDate BETWEEN @FromDate AND @ToDate
    GROUP  BY da.FailureReason
    ORDER  BY Count DESC;

    -- Result set 3: status breakdown
    SELECT Status, COUNT(*) AS Count
    FROM   Deliveries
    WHERE  ScheduledDate BETWEEN @FromDate AND @ToDate
    GROUP  BY Status
    ORDER  BY Status;
END

