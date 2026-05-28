-- Migration 016: Scheduling and delivery configuration
-- Adds admin-configurable settings for dynamic time slots, lead times, and cut-fruit radius.
-- Adds delivery lat/lng columns to Orders (captured via browser geolocation at checkout).

BEGIN TRANSACTION;

-- ── Scheduling settings ───────────────────────────────────────────────────────
INSERT INTO AppSettings (SettingKey, Value) VALUES
('order_lead_time_hours',        '2'),    -- Min hours between order time and first available slot
('cut_fruit_lead_time_hours',    '1'),    -- Shorter lead time allowed for cut-fruit (nearby) orders
('delivery_slot_start_hour',     '9'),    -- Slot window opens at 9 AM (Nepal time)
('delivery_slot_end_hour',       '21'),   -- Slot window closes at 9 PM (Nepal time)
('slot_interval_minutes',        '180');  -- 3-hour slot intervals (180 min = 9-12, 12-3, 3-6, 6-9)

-- ── Cut-fruit delivery radius ─────────────────────────────────────────────────
-- store_latitude / store_longitude: business/store location (defaults to Kathmandu)
-- cut_fruit_delivery_radius_km: max km from store for cut-fruit delivery; 0 = disabled
INSERT INTO AppSettings (SettingKey, Value) VALUES
('store_latitude',               '27.7172'),
('store_longitude',              '85.3240'),
('cut_fruit_delivery_radius_km', '5');

-- ── Delivery location on Orders ───────────────────────────────────────────────
ALTER TABLE Orders ADD DeliveryLatitude  FLOAT NULL;
ALTER TABLE Orders ADD DeliveryLongitude FLOAT NULL;

COMMIT TRANSACTION;
