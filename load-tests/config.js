// ─── Shared configuration ────────────────────────────────────────────────────
// Override any value by passing environment variables:
//   k6 run --env BASE_URL=https://api.falfulfresh.com scenarios/02-load.js

export const BASE_URL    = (__ENV.BASE_URL    || 'http://localhost:5287').replace(/\/$/, '');
export const API         = `${BASE_URL}/api`;

// Default test-user credentials (must be pre-created — see README.md)
export const TEST_EMAIL    = __ENV.TEST_EMAIL    || 'loadtest@falfulfresh.com';
export const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest@123!';

// Pool of users for multi-user scenarios (25 accounts — see README.md)
export const USER_POOL = Array.from({ length: 25 }, (_, i) => ({
  identifier: `loadtest${String(i + 1).padStart(2, '0')}@falfulfresh.com`,
  password:   'LoadTest@123!',
}));

// Delivery parameters used when placing test orders
export const DELIVERY = {
  fullAddress:      '123 Thamel Road, Kathmandu',
  city:             'Kathmandu',
  deliveryPhone:    '9841234567',
  addressLabel:     'Home',
  deliveryTimeSlot: '9AM-12PM',
  paymentMethod:    1,          // 1 = Cash on Delivery
  notes:            '[LOAD TEST] Auto-generated order — safe to delete',
};

// Acceptable performance thresholds (used by all scenarios)
export const THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed:   ['rate<0.01'],
  checks:            ['rate>0.95'],
};
