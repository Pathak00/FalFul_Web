-- Delivery system redesign: expand Deliveries, add DeliveryAttempts, DeliveryIssues, OrderRatings

-- 1. Expand Deliveries table
ALTER TABLE Deliveries ADD AssignedAt   DATETIME2 NULL;
ALTER TABLE Deliveries ADD PickedUpAt   DATETIME2 NULL;
ALTER TABLE Deliveries ADD FailedAt     DATETIME2 NULL;
ALTER TABLE Deliveries ADD AttemptCount TINYINT   NOT NULL DEFAULT 0;
ALTER TABLE Deliveries ADD MaxAttempts  TINYINT   NOT NULL DEFAULT 3;

-- Remap old status values to new scheme
-- Old: 1=Scheduled 2=PickedUp 3=OutForDelivery 4=Delivered 5=Failed
-- New: 1=Scheduled 2=Assigned 3=PickedUp 4=InTransit 5=AttemptFailed 6=Delivered 7=ReturnedToWarehouse 8=Rescheduled
UPDATE Deliveries SET Status = 6 WHERE Status = 4;   -- Delivered
UPDATE Deliveries SET Status = 4 WHERE Status = 3;   -- OutForDelivery -> InTransit
UPDATE Deliveries SET Status = 3 WHERE Status = 2;   -- PickedUp stays PickedUp (slot 3 now)
-- Status 1 (Scheduled) and 5 (Failed -> AttemptFailed) unchanged

-- 2. DeliveryAttempts
CREATE TABLE DeliveryAttempts (
    Id                  INT           IDENTITY(1,1) PRIMARY KEY,
    DeliveryId          INT           NOT NULL REFERENCES Deliveries(Id),
    AttemptNumber       TINYINT       NOT NULL DEFAULT 1,
    AttemptedAt         DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    RiderName           NVARCHAR(100) NULL,
    RiderPhone          NVARCHAR(20)  NULL,
    WasSuccessful       BIT           NOT NULL DEFAULT 0,
    -- 1=CustomerNotHome 2=WrongAddress 3=CustomerRefused 4=PaymentRefused
    -- 5=ProductDamaged 6=WeatherConditions 7=VehicleBreakdown 8=ContactNotReachable 9=AddressNotFound 10=Other
    FailureReason       TINYINT       NULL,
    FailureNotes        NVARCHAR(500) NULL,
    -- NextAction: 1=Reschedule 2=ReturnToWarehouse 3=RetryToday
    NextAction          TINYINT       NULL,
    RescheduledDate     DATE          NULL,
    RescheduledTimeSlot NVARCHAR(30)  NULL,
    CreatedAt           DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);

-- 3. DeliveryIssues
CREATE TABLE DeliveryIssues (
    Id              INT            IDENTITY(1,1) PRIMARY KEY,
    DeliveryId      INT            NOT NULL REFERENCES Deliveries(Id),
    -- 1=DeliveryFailed 2=ProductDamaged 3=WrongItem 4=LateDelivery 5=RiderBehavior 6=PaymentIssue 7=AccessIssue 8=Other
    IssueType       TINYINT        NOT NULL,
    -- 1=Rider 2=Admin 3=Customer
    ReportedBy      TINYINT        NOT NULL DEFAULT 2,
    Description     NVARCHAR(1000) NOT NULL,
    ReportedAt      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    ResolvedAt      DATETIME2      NULL,
    ResolutionNotes NVARCHAR(500)  NULL,
    IsResolved      BIT            NOT NULL DEFAULT 0
);

-- 4. OrderRatings
CREATE TABLE OrderRatings (
    Id                   INT            IDENTITY(1,1) PRIMARY KEY,
    OrderId              INT            NOT NULL UNIQUE REFERENCES Orders(Id),
    UserId               INT            NOT NULL REFERENCES Users(Id),
    DeliveryRating       TINYINT        NULL,           -- 1-5, optional
    ProductQualityRating TINYINT        NULL,           -- 1-5, optional
    OverallRating        TINYINT        NOT NULL,       -- 1-5, required
    Comment              NVARCHAR(1000) NULL,
    CreatedAt            DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
