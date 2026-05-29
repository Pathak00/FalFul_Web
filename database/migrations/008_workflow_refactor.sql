-- =============================================================================
-- Migration 008: Order & Delivery Workflow Refactor
-- =============================================================================
-- Order statuses: same integer values, semantic rename only (no data migration)
--   2: Paid            → Confirmed         (same int)
--   4: ReadyForDispatch → ReadyForDelivery  (same int)
--   6: Refunded        → Rejected          (same int)
--
-- Delivery statuses: value 7 is repurposed; Returned shifts to 9
--   Old 7 = Returned  → New 9 = Returned   (data migration required)
--   New 7 = CustomerUnavailable            (new, previously unused)
--   New 8 = Rescheduled                    (new, previously unused)
-- =============================================================================

BEGIN TRANSACTION;

-- Migrate any existing Delivery rows with old Returned(7) to new Returned(9).
-- This is safe to run multiple times (rows at 7 won't exist after first run).
UPDATE Deliveries SET Status = 9 WHERE Status = 7;

-- No order row migration needed: integer values for statuses 1–6 are unchanged.
-- Code/label changes are handled in application-layer enums and SPs.

COMMIT TRANSACTION;
