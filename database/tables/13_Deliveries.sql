CREATE TABLE Deliveries (
    Id                INT           IDENTITY(1,1) PRIMARY KEY,
    OrderId           INT           NOT NULL UNIQUE REFERENCES Orders(Id),
    -- Status: 1=Scheduled 2=Assigned 3=PickedUp 4=InTransit 5=AttemptFailed
    --         6=Delivered 7=ReturnedToWarehouse 8=Rescheduled
    Status            TINYINT       NOT NULL DEFAULT 1,
    ScheduledDate     DATE          NOT NULL,
    ScheduledTimeSlot NVARCHAR(30)  NOT NULL,
    RiderName         NVARCHAR(100) NULL,
    RiderPhone        NVARCHAR(20)  NULL,
    AssignedAt        DATETIME2     NULL,
    PickedUpAt        DATETIME2     NULL,
    DeliveredAt       DATETIME2     NULL,
    FailedAt          DATETIME2     NULL,
    AttemptCount      TINYINT       NOT NULL DEFAULT 0,
    MaxAttempts       TINYINT       NOT NULL DEFAULT 3,
    TrackingNotes     NVARCHAR(500) NULL,
    CreatedAt         DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2     NULL
);
