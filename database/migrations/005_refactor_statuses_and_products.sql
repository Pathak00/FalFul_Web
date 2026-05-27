-- =============================================================================
-- Migration 005: Status Refactor + Product MinOrderGrams
-- Orders and Deliveries now own separate, non-overlapping lifecycle statuses.
-- =============================================================================

BEGIN TRANSACTION;

-- ── 1. Remap Order Statuses ───────────────────────────────────────────────────
-- Old: 1=Pending, 2=Confirmed, 3=Preparing, 4=OutForDelivery, 5=Delivered, 6=Cancelled, 7=Refunded
-- New: 1=Pending, 2=Paid,      3=Preparing, 4=ReadyForDispatch,            5=Cancelled, 6=Refunded

-- Old Delivered(5) → ReadyForDispatch(4)  (delivery module owns completion)
UPDATE Orders SET Status = 4 WHERE Status = 5;

-- Old Cancelled(6) → new Cancelled(5)
UPDATE Orders SET Status = 5 WHERE Status = 6;

-- Old Refunded(7)  → new Refunded(6)
UPDATE Orders SET Status = 6 WHERE Status = 7;

-- ── 2. Remap Delivery Statuses ────────────────────────────────────────────────
-- Old: 1=Scheduled, 2=Assigned, 3=PickedUp, 4=InTransit, 5=AttemptFailed,
--      6=Delivered, 7=ReturnedToWarehouse, 8=Rescheduled
-- New: 1=AwaitingRider, 2=Assigned, 3=PickedUp, 4=OutForDelivery,
--      5=Delivered, 6=Failed, 7=Returned

-- 5 (AttemptFailed) and 6 (Delivered) swap values – use temp to avoid collision
UPDATE Deliveries SET Status = 99 WHERE Status = 5;   -- AttemptFailed → temp
UPDATE Deliveries SET Status = 5  WHERE Status = 6;   -- old Delivered(6) → new Delivered(5)
UPDATE Deliveries SET Status = 6  WHERE Status = 99;  -- temp → new Failed(6)

-- Old Rescheduled(8) → AwaitingRider(1)  (rescheduling = back to waiting for rider)
UPDATE Deliveries SET Status = 1  WHERE Status = 8;

-- Cancellations synced from Order cancel (old status 5 there was pointing to old delivery 5)
-- These are already handled by the order remap + the delivery SP update below.

-- ── 3. Add Products.MinOrderGrams ─────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'MinOrderGrams'
)
BEGIN
    ALTER TABLE Products ADD MinOrderGrams INT NULL;
END

-- ── 4. Seed default cut-fruit price rules (idempotent) ────────────────────────
MERGE PriceRules AS target
USING (VALUES
    ('cut_fruit_min_grams',  'Cut Fruit Min. Grams',  100, 'g',   1),
    ('cut_fruit_gram_step',  'Cut Fruit Gram Step',    50, 'g',   1)
) AS src (RuleKey, RuleName, Value, Unit, IsActive)
ON target.RuleKey = src.RuleKey
WHEN NOT MATCHED THEN
    INSERT (RuleKey, RuleName, Value, Unit, IsActive, UpdatedAt)
    VALUES (src.RuleKey, src.RuleName, src.Value, src.Unit, src.IsActive, GETUTCDATE());

COMMIT TRANSACTION;
