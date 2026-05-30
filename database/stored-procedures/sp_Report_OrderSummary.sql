CREATE OR ALTER PROCEDURE sp_Report_OrderSummary
    @FromDate DATE = NULL,
    @ToDate   DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @FromDate = ISNULL(@FromDate, CAST(DATEADD(DAY, -30, dbo.fn_NepalNow()) AS DATE));
    SET @ToDate   = ISNULL(@ToDate,   CAST(dbo.fn_NepalNow() AS DATE));

    -- Result set 1: summary row
    -- "Delivered" = orders whose linked delivery has Status=5 (Delivered)
    SELECT
        COUNT(*)                                                                     AS TotalOrders,
        SUM(CASE WHEN d.Status = 5                     THEN 1    ELSE 0    END)      AS Delivered,
        SUM(CASE WHEN o.Status = 5                     THEN 1    ELSE 0    END)      AS Cancelled,
        SUM(CASE WHEN o.Status IN (1,2,3,4)            THEN 1    ELSE 0    END)      AS Active,
        ISNULL(SUM(o.TotalAmount), 0)                                                AS TotalRevenue,
        ISNULL(CAST(AVG(o.TotalAmount) AS DECIMAL(10,2)), 0)                         AS AvgOrderValue,
        ISNULL(SUM(CASE WHEN d.Status = 5 THEN o.TotalAmount ELSE 0 END), 0)         AS DeliveredRevenue
    FROM   Orders o
    LEFT   JOIN Deliveries d ON d.OrderId = o.Id
    WHERE  CAST(o.CreatedAt AS DATE) BETWEEN @FromDate AND @ToDate;

    -- Result set 2: order status breakdown
    SELECT o.Status, COUNT(*) AS Count, ISNULL(SUM(o.TotalAmount), 0) AS Revenue
    FROM   Orders o
    WHERE  CAST(o.CreatedAt AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP  BY o.Status
    ORDER  BY o.Status;

    -- Result set 3: payment method breakdown
    SELECT PaymentMethod, COUNT(*) AS Count, ISNULL(SUM(TotalAmount), 0) AS Revenue
    FROM   Orders
    WHERE  CAST(CreatedAt AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP  BY PaymentMethod;
END

