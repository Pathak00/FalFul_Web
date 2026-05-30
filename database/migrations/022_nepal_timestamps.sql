-- Migration 022: Switch all timestamps from UTC to Nepal Standard Time (UTC+05:45)
--
-- Why: The application targets Nepal exclusively. Storing UTC causes a double-shift
--      bug when the JSON serializer and Angular date pipe both apply the +05:45 offset.
--      After this migration every timestamp in the DB is Nepal local time.

-- ── 1. Nepal time function ────────────────────────────────────────────────────

IF OBJECT_ID('dbo.fn_NepalNow', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_NepalNow;
GO

CREATE FUNCTION dbo.fn_NepalNow()
RETURNS DATETIME2
AS
BEGIN
    RETURN DATEADD(MINUTE, 345, GETUTCDATE());
END
GO

-- ── 2. Convert existing UTC timestamps → Nepal time (UTC + 5h 45m) ───────────

BEGIN TRANSACTION;

UPDATE Users SET
    CreatedAt   = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt   = CASE WHEN UpdatedAt   IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt)   END,
    LastLoginAt = CASE WHEN LastLoginAt IS NOT NULL THEN DATEADD(MINUTE, 345, LastLoginAt) END;

UPDATE Organizations SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

UPDATE RefreshTokens SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt),
    ExpiresAt = DATEADD(MINUTE, 345, ExpiresAt),
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

UPDATE UserRoles SET
    AssignedAt = DATEADD(MINUTE, 345, AssignedAt);

UPDATE Products SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

UPDATE Categories SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

UPDATE Addresses SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt);

UPDATE Orders SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

UPDATE OrderRatings SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt);

UPDATE Deliveries SET
    CreatedAt   = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt   = CASE WHEN UpdatedAt   IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt)   END,
    AssignedAt  = CASE WHEN AssignedAt  IS NOT NULL THEN DATEADD(MINUTE, 345, AssignedAt)  END,
    PickedUpAt  = CASE WHEN PickedUpAt  IS NOT NULL THEN DATEADD(MINUTE, 345, PickedUpAt)  END,
    DeliveredAt = CASE WHEN DeliveredAt IS NOT NULL THEN DATEADD(MINUTE, 345, DeliveredAt) END,
    FailedAt    = CASE WHEN FailedAt    IS NOT NULL THEN DATEADD(MINUTE, 345, FailedAt)    END;

UPDATE DeliveryAttempts SET
    AttemptedAt = DATEADD(MINUTE, 345, AttemptedAt),
    CreatedAt   = DATEADD(MINUTE, 345, CreatedAt);

UPDATE DeliveryIssues SET
    ReportedAt = DATEADD(MINUTE, 345, ReportedAt),
    ResolvedAt = CASE WHEN ResolvedAt IS NOT NULL THEN DATEADD(MINUTE, 345, ResolvedAt) END;

UPDATE Pages SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

UPDATE Banners SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

UPDATE MenuItems SET
    CreatedAt = DATEADD(MINUTE, 345, CreatedAt),
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

UPDATE AppSettings SET
    UpdatedAt = DATEADD(MINUTE, 345, UpdatedAt);

UPDATE PriceRules SET
    UpdatedAt = DATEADD(MINUTE, 345, UpdatedAt)
WHERE UpdatedAt IS NOT NULL;

UPDATE HomepageSections SET
    UpdatedAt = CASE WHEN UpdatedAt IS NOT NULL THEN DATEADD(MINUTE, 345, UpdatedAt) END;

COMMIT TRANSACTION;
