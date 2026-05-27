CREATE TABLE Deliveries (
    Id                INT             IDENTITY(1,1) PRIMARY KEY,
    OrderId           INT             NOT NULL UNIQUE REFERENCES Orders(Id),
    -- Status: 1=Scheduled 2=PickedUp 3=OutForDelivery 4=Delivered 5=Failed
    Status            TINYINT         NOT NULL DEFAULT 1,
    ScheduledDate     DATE            NOT NULL,
    ScheduledTimeSlot NVARCHAR(30)    NOT NULL,
    DeliveredAt       DATETIME2       NULL,
    RiderName         NVARCHAR(100)   NULL,
    RiderPhone        NVARCHAR(20)    NULL,
    TrackingNotes     NVARCHAR(500)   NULL,
    CreatedAt         DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2       NULL
);
